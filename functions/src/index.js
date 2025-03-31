// functions/src/index.js

const functions = require("firebase-functions/v1");
const admin = require("firebase-admin");
const nodemailer = require("nodemailer");
const logger = require("firebase-functions/logger");
const Stripe = require("stripe");

// Initialize Firebase Admin only once
if (!admin.apps.length) {
  admin.initializeApp();
}

// Get the Stripe secret key from environment config
const stripeSecretKey = functions.config().stripe?.secret_key;

// Initialize Stripe with the secret key
const stripe = new Stripe(
  stripeSecretKey,
  {
    apiVersion: "2023-10-16"
  }
);

/**
 * Create a payment intent for Stripe checkout
 */
const createPaymentIntent = functions
  .region("us-central1")
  .https.onCall(async (data, context) => {
    try {
      // Validate required fields
      if (!data.amount || !data.currency || !data.watchId) {
        throw new functions.https.HttpsError(
          "invalid-argument",
          "Missing required payment information."
        );
      }

      // Amount should be in cents for Stripe
      const amount = parseInt(data.amount);

      // Store shipping info if provided
      let shippingInfoId = data.shippingInfoId || null;

      // If shipping data provided directly in the request, save it
      if (data.shipping && !shippingInfoId) {
        try {
          // Create a new document in the shippingInfo collection
          const shippingRef = await admin.firestore().collection("shippingInfo").add({
            userId: context.auth?.uid || "anonymous",
            watchId: data.watchId,
            name: data.shipping.name,
            email: data.shipping.email,
            phone: data.shipping.phone,
            address: data.shipping.address,
            city: data.shipping.city,
            zipCode: data.shipping.zipCode,
            state: data.shipping.state,
            country: data.shipping.country,
            created: admin.firestore.FieldValue.serverTimestamp()
          });
          shippingInfoId = shippingRef.id;
        } catch (error) {
          // Continue even if there's an error with shipping info
        }
      }

      // Create a payment intent with Stripe
      const paymentIntent = await stripe.paymentIntents.create({
        amount,
        currency: data.currency || "usd",
        metadata: {
          userId: context.auth?.uid || "anonymous",
          watchId: data.watchId,
          description: data.description || "Watch purchase",
          shippingInfoId: shippingInfoId
        }
      });

      // Save the payment intent to Firestore for tracking
      await admin.firestore().collection("payments").add({
        userId: context.auth?.uid || "anonymous",
        watchId: data.watchId,
        amount,
        currency: data.currency,
        status: "pending",
        paymentIntentId: paymentIntent.id,
        shippingInfoId: shippingInfoId,
        created: admin.firestore.FieldValue.serverTimestamp()
      });

      // Return the client secret
      return {
        clientSecret: paymentIntent.client_secret
      };
    } catch (error) {
      throw new functions.https.HttpsError(
        "internal",
        "Unable to create payment intent: " + error.message
      );
    }
  });

/**
 * Process a webhook from Stripe to update payment status
 */
const stripeWebhook = functions
  .region("us-central1")
  .https.onRequest(async (req, res) => {
    const signature = req.headers["stripe-signature"];

    // Get webhook secret from environment config
    const webhookSecret = functions.config().stripe?.webhook_secret || "";

    try {
      // Verify the event came from Stripe
      let event;

      try {
        if (!signature) {
          return res.status(400).send("Missing signature");
        }

        if (!webhookSecret) {
          // No webhook secret found; use raw event data
          event = { 
            type: req.body.type,
            data: { object: req.body.data?.object }
          };
        } else {
          event = stripe.webhooks.constructEvent(
            req.rawBody,
            signature,
            webhookSecret
          );
        }
      } catch (err) {
        return res.status(400).send(`Webhook Error: ${err.message}`);
      }

      // Handle specific event types
      if (event.type === "payment_intent.succeeded") {
        const paymentIntent = event.data.object;
        await handleSuccessfulPayment(paymentIntent);
      } else if (event.type === "payment_intent.payment_failed") {
        const paymentIntent = event.data.object;
        await handleFailedPayment(paymentIntent);
      }

      // Return success
      res.status(200).send({ received: true });
    } catch (error) {
      res.status(500).send(`Webhook Error: ${error.message}`);
    }
  });

/**
 * Handle successful payments by updating Firestore
 */
async function handleSuccessfulPayment(paymentIntent) {
  try {
    // Find the payment record
    const paymentsRef = admin.firestore().collection("payments");
    const snapshot = await paymentsRef
      .where("paymentIntentId", "==", paymentIntent.id)
      .get();

    if (snapshot.empty) {
      return;
    }

    // Update the payment record
    const docSnap = snapshot.docs[0];
    const paymentData = docSnap.data();
    paymentData.id = docSnap.id; // Add document ID to the data

    await docSnap.ref.update({
      status: "completed",
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Get shipping information if available
    let shippingInfo = null;
    if (paymentData.shippingInfoId || paymentIntent.metadata.shippingInfoId) {
      const shippingId = paymentData.shippingInfoId || paymentIntent.metadata.shippingInfoId;
      try {
        const shippingDoc = await admin.firestore().collection("shippingInfo").doc(shippingId).get();
        if (shippingDoc.exists) {
          shippingInfo = shippingDoc.data();
        }
      } catch (error) {
        // Continue even if shipping info retrieval fails
      }
    }

    // Update the watch document to put it on hold (check if document exists first)
    if (paymentData.watchId) {
      const watchRef = admin.firestore().collection("Watches").doc(paymentData.watchId);
      const watchDoc = await watchRef.get();
      if (watchDoc.exists) {
        await watchRef.update({
          hold: true,
          holdAt: admin.firestore.FieldValue.serverTimestamp(),
          holdBy: paymentData.userId,
          shippingInfoId: paymentData.shippingInfoId || paymentIntent.metadata.shippingInfoId
        });
      }
    }

    // Send confirmation email with shipping details included
    await sendPurchaseConfirmationEmail(paymentData, shippingInfo);
  } catch (error) {
    // Silent error handling for production
  }
}

/**
 * Handle failed payments by updating Firestore
 */
async function handleFailedPayment(paymentIntent) {
  try {
    // Find the payment record
    const paymentsRef = admin.firestore().collection("payments");
    const snapshot = await paymentsRef
      .where("paymentIntentId", "==", paymentIntent.id)
      .get();

    if (snapshot.empty) {
      return;
    }

    // Update the payment record
    const docSnap = snapshot.docs[0];
    await docSnap.ref.update({
      status: "failed",
      error: paymentIntent.last_payment_error?.message || "Payment failed",
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
  } catch (error) {
    // Silent error handling for production
  }
}

/**
 * Send a purchase confirmation email with shipping details
 */
async function sendPurchaseConfirmationEmail(paymentData, shippingInfo) {
  try {
    // Get watch details
    let watch = null;
    if (paymentData.watchId) {
      const watchRef = admin.firestore().collection("Watches").doc(paymentData.watchId);
      const watchDoc = await watchRef.get();
      if (watchDoc.exists) {
        watch = watchDoc.data();
      }
    }

    // Configure Nodemailer with Mailgun SMTP settings
    const mailgunUsername = functions.config().mailgun?.username;
    const mailgunPassword = functions.config().mailgun?.password;
    const mailgunSender = functions.config().mailgun?.sender || "noreply@watchsalon.com";

    // Validate email configuration is present
    if (!mailgunUsername || !mailgunPassword) {
      return;
    }

    // Create purchase confirmation email with shipping info
    const emailSubject = `New Purchase - ${watch ? `${watch.brand} ${watch.model}` : "Watch"}`;
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #002d4e;">New Watch Purchase</h2>
        <h3>Payment Details:</h3>
        <p>
          <strong>Amount:</strong> $${(paymentData.amount / 100).toLocaleString()}<br>
          <strong>Payment ID:</strong> ${paymentData.paymentIntentId || "N/A"}<br>
          <strong>Status:</strong> Completed<br>
          <strong>Purchased At:</strong> ${paymentData.created ? new Date(paymentData.created._seconds * 1000).toISOString() : new Date().toISOString()}<br>
        </p>
        ${watch ? `
          <h3>Watch Details:</h3>
          <p>
            <strong>Brand:</strong> ${watch.brand || "N/A"}<br>
            <strong>Model:</strong> ${watch.model || "N/A"}<br>
            <strong>Reference:</strong> ${watch.referenceNumber || "N/A"}<br>
            <strong>SKU:</strong> ${watch.sku || "N/A"}<br>
          </p>
        ` : ""}
        ${shippingInfo ? `
          <h3>Shipping Information:</h3>
          <p>
            <strong>Name:</strong> ${shippingInfo.name || "N/A"}<br>
            <strong>Email:</strong> ${shippingInfo.email || "N/A"}<br>
            <strong>Phone:</strong> ${shippingInfo.phone || "N/A"}<br>
            <strong>Address:</strong> ${shippingInfo.address || "N/A"}<br>
            <strong>City:</strong> ${shippingInfo.city || "N/A"}<br>
            <strong>State:</strong> ${shippingInfo.state || "N/A"}<br>
            <strong>ZIP/Postal Code:</strong> ${shippingInfo.zipCode || "N/A"}<br>
            <strong>Country:</strong> ${shippingInfo.country || "N/A"}<br>
          </p>
        ` : ""}
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666;">
          <p>This email was automatically sent from the Watch Salon website.</p>
        </div>
      </div>
    `;

    // Send email to admin
    const adminMailOptions = {
      from: mailgunSender,
      to: "cclosework@gmail.com", // Admin email address
      subject: emailSubject,
      html: emailHtml,
    };

    // Send confirmation email to customer if we have their email.
    // Use shippingInfo.email if available; otherwise, fallback to paymentData.email.
    const customerEmail = (shippingInfo && shippingInfo.email) ? shippingInfo.email : (paymentData.email || null);
    if (customerEmail) {
      const customerSubject = `Your Watch Salon Purchase - ${watch ? `${watch.brand} ${watch.model}` : "Watch"}`;
      const customerHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #002d4e;">Thank You for Your Purchase!</h2>
          <p>Dear ${shippingInfo && shippingInfo.name ? shippingInfo.name : "Valued Customer"},</p>
          <p>Thank you for your purchase from Watch Salon. Your order has been confirmed and we're preparing it for shipment.</p>
          
          <h3>Order Details:</h3>
          <p>
            <strong>Amount:</strong> $${(paymentData.amount / 100).toLocaleString()}<br>
            <strong>Date:</strong> ${new Date().toLocaleDateString()}<br>
          </p>
          ${watch ? `
            <h3>Watch Details:</h3>
            <p>
              <strong>Brand:</strong> ${watch.brand || "N/A"}<br>
              <strong>Model:</strong> ${watch.model || "N/A"}<br>
              <strong>Reference:</strong> ${watch.referenceNumber || "N/A"}<br>
            </p>
          ` : ""}
          <h3>Shipping Address:</h3>
          <p>
            ${shippingInfo && shippingInfo.name ? shippingInfo.name : ""}<br>
            ${shippingInfo && shippingInfo.address ? shippingInfo.address : ""}<br>
            ${shippingInfo && shippingInfo.city ? shippingInfo.city : ""}, ${shippingInfo && shippingInfo.state ? shippingInfo.state : ""} ${shippingInfo && shippingInfo.zipCode ? shippingInfo.zipCode : ""}<br>
            ${shippingInfo && shippingInfo.country ? shippingInfo.country : ""}
          </p>
          
          <p>We'll send you a notification when your order ships with tracking information.</p>
          
          <p>If you have any questions about your order, please contact us at <a href="mailto:cclosework@gmail.com">cclosework@gmail.com</a>.</p>
          
          <p>Thank you for choosing Watch Salon!</p>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666;">
            <p>This is an automated confirmation email for your Watch Salon purchase.</p>
          </div>
        </div>
      `;

      const customerMailOptions = {
        from: mailgunSender,
        to: customerEmail,
        subject: customerSubject,
        html: customerHtml,
      };

      await transporter.sendMail(customerMailOptions);
    }

    await transporter.verify();
    await transporter.sendMail(adminMailOptions);

    // Update payment record to mark email as sent
    try {
      const paymentRef = admin.firestore().collection("payments").doc(paymentData.id);
      await paymentRef.update({
        emailSent: true,
        emailSentTimestamp: admin.firestore.FieldValue.serverTimestamp(),
      });
    } catch (error) {
      // Silent error handling
    }
  } catch (error) {
    // Silent error handling for production
  }
}

/**
 * Retrieve Mailgun SMTP credentials from Firebase Functions config.
 */
const mailgunUsername = functions.config().mailgun?.username;
const mailgunPassword = functions.config().mailgun?.password;
const mailgunSender = functions.config().mailgun?.sender;

/**
 * Configure Nodemailer with Mailgun SMTP settings
 */
const transporter = nodemailer.createTransport({
  host: "smtp.mailgun.org",
  port: 587,
  secure: false,
  auth: {
    user: mailgunUsername,
    pass: mailgunPassword,
  },
  tls: {
    rejectUnauthorized: true
  }
});

/**
 * List the Firestore collections that should trigger an email.
 */
const allowedCollections = [
  "TradeRequests",
  "SellRequests",
  "Requests",
  "Messages",
  "payments",
  "shippingInfo"
];

/**
 * Firestore Trigger: on document creation in any allowed collection.
 */
const onRequestDocCreate = functions
  .region("us-central1")
  .firestore
  .document("{collectionName}/{docId}")
  .onCreate(async (snapshot, context) => {
    const collectionName = context.params.collectionName;

    // Check if this is a collection we care about
    if (!allowedCollections.includes(collectionName)) {
      return null;
    }

    // Get document data
    const data = snapshot.data();
    if (!data) {
      return null;
    }

    // Special handling for payments collection
    if (collectionName === "payments") {
      // Only send email for completed payments, not pending ones
      if (data.status === "completed") {
        try {
          // Get watch details
          let watch = null;
          if (data.watchId) {
            const watchRef = admin.firestore().collection("Watches").doc(data.watchId);
            const watchDoc = await watchRef.get();
            if (watchDoc.exists) {
              watch = watchDoc.data();
            }
          }

          // Get shipping information if available
          let shippingInfo = null;
          if (data.shippingInfoId) {
            try {
              const shippingDoc = await admin.firestore().collection("shippingInfo").doc(data.shippingInfoId).get();
              if (shippingDoc.exists) {
                shippingInfo = shippingDoc.data();
              }
            } catch (error) {
              // Continue if shipping info retrieval fails
            }
          }

          // Create purchase confirmation email
          const emailSubject = `New Purchase - ${watch ? `${watch.brand} ${watch.model}` : "Watch"}`;
          const emailHtml = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #002d4e;">New Watch Purchase</h2>
              <h3>Payment Details:</h3>
              <p>
                <strong>Amount:</strong> $${(data.amount / 100).toLocaleString()}<br>
                <strong>Payment ID:</strong> ${data.paymentIntentId || "N/A"}<br>
                <strong>Status:</strong> Completed<br>
                <strong>Purchased At:</strong> ${data.created ? new Date(data.created._seconds * 1000).toISOString() : new Date().toISOString()}<br>
              </p>
              ${watch ? `
                <h3>Watch Details:</h3>
                <p>
                  <strong>Brand:</strong> ${watch.brand || "N/A"}<br>
                  <strong>Model:</strong> ${watch.model || "N/A"}<br>
                  <strong>Reference:</strong> ${watch.referenceNumber || "N/A"}<br>
                  <strong>SKU:</strong> ${watch.sku || "N/A"}<br>
                </p>
              ` : ""}
              ${shippingInfo ? `
                <h3>Shipping Information:</h3>
                <p>
                  <strong>Name:</strong> ${shippingInfo.name || "N/A"}<br>
                  <strong>Email:</strong> ${shippingInfo.email || "N/A"}<br>
                  <strong>Phone:</strong> ${shippingInfo.phone || "N/A"}<br>
                  <strong>Address:</strong> ${shippingInfo.address || "N/A"}<br>
                  <strong>City:</strong> ${shippingInfo.city || "N/A"}<br>
                  <strong>State:</strong> ${shippingInfo.state || "N/A"}<br>
                  <strong>ZIP/Postal Code:</strong> ${shippingInfo.zipCode || "N/A"}<br>
                  <strong>Country:</strong> ${shippingInfo.country || "N/A"}<br>
                </p>
              ` : ""}
              <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666;">
                <p>This email was automatically sent from the Watch Salon website.</p>
              </div>
            </div>
          `;

          // Send email
          const mailOptions = {
            from: mailgunSender,
            to: "cclosework@gmail.com",
            subject: emailSubject,
            html: emailHtml,
          };

          await transporter.verify();
          await transporter.sendMail(mailOptions);

          // Update the document to mark email as sent
          await snapshot.ref.update({
            emailSent: true,
            emailSentTimestamp: admin.firestore.FieldValue.serverTimestamp(),
          });
        } catch (error) {
          // Silent error handling for production
        }
      }

      return null;
    }

    // Special handling for shippingInfo collection
    if (collectionName === "shippingInfo") {
      try {
        // Create notification email about new shipping info
        const emailSubject = `New Shipping Information - ${data.name || "Customer"}`;
        const emailHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #002d4e;">New Shipping Information Submitted</h2>
            <h3>Customer Details:</h3>
            <p>
              <strong>Name:</strong> ${data.name || "N/A"}<br>
              <strong>Email:</strong> ${data.email || "N/A"}<br>
              <strong>Phone:</strong> ${data.phone || "N/A"}<br>
            </p>
            <h3>Shipping Address:</h3>
            <p>
              <strong>Address:</strong> ${data.address || "N/A"}<br>
              <strong>City:</strong> ${data.city || "N/A"}<br>
              <strong>State:</strong> ${data.state || "N/A"}<br>
              <strong>ZIP/Postal Code:</strong> ${data.zipCode || "N/A"}<br>
              <strong>Country:</strong> ${data.country || "N/A"}<br>
            </p>
            ${data.watchId ? `
              <p>
                <strong>Watch ID:</strong> ${data.watchId}<br>
              </p>
            ` : ""}
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666;">
              <p>This email was automatically sent from the Watch Salon website.</p>
            </div>
          </div>
        `;

        const mailOptions = {
          from: mailgunSender,
          to: "cclosework@gmail.com",
          subject: emailSubject,
          html: emailHtml,
        };

        await transporter.verify();
        await transporter.sendMail(mailOptions);

        await snapshot.ref.update({
          emailSent: true,
          emailSentTimestamp: admin.firestore.FieldValue.serverTimestamp(),
        });
      } catch (error) {
        // Silent error handling for production
      }

      return null;
    }

    // Regular email handling for other collections
    const {
      mode = "unknown",
      email = "",
      phoneNumber = "",
      message = "",
      reference = "",
      photoURL = "",
      createdAt = new Date().toISOString(),
      watchBrand = "",
      watchModel = "",
      watchPrice = "",
      watchId = ""
    } = data;

    const isMessageCollection = collectionName === "Messages";

    if (!isMessageCollection && (!email || !phoneNumber)) {
      return null;
    }

    let requestTypeText = "";
    switch (mode) {
      case "trade":
        requestTypeText = "Trade Request";
        break;
      case "sell":
        requestTypeText = "Sell Request";
        break;
      case "request":
        requestTypeText = "Customer Inquiry";
        break;
      default:
        requestTypeText = collectionName === "Messages" ? "Customer Message" : "Website Request";
    }

    let emailSubject = "";
    let emailHtml = "";

    if (isMessageCollection) {
      emailSubject = `New Customer Message - ${data.name || "Website Visitor"}`;
      emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #002d4e;">New Customer Message</h2>
          <h3>Contact Information:</h3>
          <p>
            <strong>Name:</strong> ${data.name || "Not provided"}<br>
            <strong>Email:</strong> ${data.email || "Not provided"}<br>
            <strong>Phone:</strong> ${data.phone || "Not provided"}<br>
            <strong>Submitted At:</strong> ${createdAt}<br>
          </p>
          <h3>Message:</h3>
          <p style="background-color: #f5f5f5; padding: 15px; border-radius: 5px;">
            ${(data.message || "").replace(/\n/g, "<br>")}
          </p>
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666;">
            <p>This email was automatically sent from the Watch Salon website.</p>
          </div>
        </div>
      `;
    } else {
      emailSubject = `New ${requestTypeText} - ${reference || "No Reference"}`;
      emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #002d4e;">New ${requestTypeText}</h2>
          <h3>Contact Information:</h3>
          <p>
            <strong>Email:</strong> ${email}<br>
            <strong>Phone:</strong> ${phoneNumber}<br>
            <strong>Reference:</strong> ${reference || "N/A"}<br>
            <strong>Submitted At:</strong> ${createdAt || "N/A"}<br>
          </p>
          <h3>Message:</h3>
          <p style="background-color: #f5f5f5; padding: 15px; border-radius: 5px;">
            ${message.replace(/\n/g, "<br>")}
          </p>
          ${(watchBrand || watchModel) ? `
            <h3>Watch Details:</h3>
            <p>
              ${watchBrand ? `<strong>Brand:</strong> ${watchBrand}<br>` : ""}
              ${watchModel ? `<strong>Model:</strong> ${watchModel}<br>` : ""}
              ${watchPrice ? `<strong>Price:</strong> $${watchPrice}<br>` : ""}
              ${watchId ? `<strong>ID:</strong> ${watchId}<br>` : ""}
            </p>
          ` : ""}
          ${photoURL ? `<h3>Photo:</h3><p><a href="${photoURL}">View Photo</a></p>` : ""}
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666;">
            <p>This email was automatically sent from the Watch Salon website.</p>
          </div>
        </div>
      `;
    }

    const mailOptions = {
      from: mailgunSender,
      to: "cclosework@gmail.com",
      subject: emailSubject,
      html: emailHtml,
    };

    try {
      await transporter.verify();
      await transporter.sendMail(mailOptions);

      await snapshot.ref.update({
        emailSent: true,
        emailSentTimestamp: admin.firestore.FieldValue.serverTimestamp(),
      });
    } catch (error) {
      try {
        await snapshot.ref.update({
          emailError: error.message,
          emailSentTimestamp: admin.firestore.FieldValue.serverTimestamp(),
        });
      } catch (updateError) {
        // Silent error handling for production
      }
    }

    return null;
  });

module.exports = {
  createPaymentIntent,
  stripeWebhook,
  onRequestDocCreate
};