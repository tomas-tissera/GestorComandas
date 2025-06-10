// firebase/functions/index.js (or your functions file)
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const cors = require("cors")({ origin: true }); // Import cors middleware

admin.initializeApp();

exports.createRestaurantUser = functions.https.onCall(async (data, context) => {
  // IMPORTANT: For onCall functions, Firebase handles CORS automatically.
  // You generally DO NOT need to add 'cors' middleware here unless you're
  // doing something highly custom that bypasses standard onCall behavior.
  // The fact you're getting CORS errors with onCall is unusual and points
  // more towards the function not being found (404) or a misconfiguration
  // on the Firebase side itself.

  // --- Start of your function logic ---
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "You must be logged in to create users."
    );
  }

  // Ensure the caller has the 'gerente' role (assuming you have a way to check roles)
  // This is a placeholder; you'd need to fetch and verify the user's custom claims.
  const callerUid = context.auth.uid;
  const userRecord = await admin.auth().getUser(callerUid);
  const customClaims = userRecord.customClaims;

  if (!customClaims || customClaims.role !== "gerente") {
    throw new functions.https.HttpsError(
      "permission-denied",
      "Only managers can create new users."
    );
  }

  const { email, password, firstName, lastName, role } = data;

  if (!email || !password || !firstName || !lastName || !role) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Missing required fields."
    );
  }

  if (password.length < 6) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Password must be at least 6 characters long."
    );
  }

  try {
    // 1. Create user in Firebase Authentication
    const user = await admin.auth().createUser({
      email,
      password,
      displayName: `${firstName} ${lastName}`,
    });

    // 2. Set custom claims for the user's role
    await admin.auth().setCustomUserClaims(user.uid, { role: role });

    // 3. Save additional user data to Firestore (optional, but good practice)
    await admin.firestore().collection("users").doc(user.uid).set({
      firstName,
      lastName,
      email,
      role,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return { message: "User created successfully!", uid: user.uid };
  } catch (error) {
    if (error.code === 'auth/email-already-in-use') {
      throw new functions.https.HttpsError(
        "already-exists", // Custom error code
        "The email address is already in use by another account."
      );
    } else {
      console.error("Error creating new user:", error);
      throw new functions.https.HttpsError(
        "internal",
        "Failed to create user.",
        error.message // Pass the original error message for debugging
      );
    }
  }
});

// If your function was an onRequest (HTTP) function, you would use cors like this:
/*
exports.myHttpFunction = functions.https.onRequest((req, res) => {
  cors(req, res, () => {
    // Your HTTP function logic here
    res.send("Hello from HTTP function!");
  });
});
*/