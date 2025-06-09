const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Inicializa el SDK de Admin, si no lo has hecho ya
// Asegúrate de que esta línea esté presente y se ejecute una sola vez
admin.initializeApp();

exports.createRestaurantUser = functions.https.onCall(async (data, context) => {
    // 1. Verificar autenticación y rol del llamador (gerente)
    if (!context.auth) {
        throw new functions.https.HttpsError(
            'unauthenticated',
            'La solicitud debe estar autenticada para crear usuarios.'
        );
    }

    const callerUid = context.auth.uid;
    const callerClaims = (await admin.auth().getUser(callerUid)).customClaims;

    // Asegúrate de que solo los gerentes puedan crear usuarios
    if (!callerClaims || callerClaims.role !== 'gerente') {
        throw new functions.https.HttpsError(
            'permission-denied',
            'Solo los gerentes pueden crear nuevos usuarios.'
        );
    }

    // 2. Validar los datos de entrada
    const { email, password, firstName, lastName, role } = data;

    if (!email || !password || !firstName || !lastName || !role) {
        throw new functions.https.HttpsError(
            'invalid-argument',
            'Faltan campos obligatorios para crear el usuario.'
        );
    }
    if (password.length < 6) {
        throw new functions.https.HttpsError(
            'invalid-argument',
            'La contraseña debe tener al menos 6 caracteres.'
        );
    }
    const allowedRoles = ['mesero', 'cajero', 'cocinero', 'gerente'];
    if (!allowedRoles.includes(role)) {
        throw new functions.https.HttpsError(
            'invalid-argument',
            'Rol de usuario inválido.'
        );
    }

    try {
        // 3. Crear el usuario en Firebase Authentication
        const userRecord = await admin.auth().createUser({
            email: email,
            password: password,
            displayName: `${firstName} ${lastName}`,
        });

        // 4. Establecer los Custom Claims (roles)
        await admin.auth().setCustomUserClaims(userRecord.uid, { role: role });

        // 5. Opcional: Guardar información adicional en Firestore
        await admin.firestore().collection('users').doc(userRecord.uid).set({
            firstName: firstName,
            lastName: lastName,
            email: email,
            role: role,
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        });

        console.log(`Usuario creado: ${userRecord.uid} con rol: ${role}`);
        return { success: true, message: 'Usuario creado exitosamente.' };

    } catch (error) {
        console.error("Error al crear usuario:", error);
        // Manejo de errores específicos de Firebase Auth
        if (error.code === 'auth/email-already-in-use') {
            throw new functions.https.HttpsError(
                'already-exists', // Usar un código de error más descriptivo
                'El correo electrónico ya está en uso.'
            );
        } else if (error.code === 'auth/invalid-email') {
            throw new functions.https.HttpsError(
                'invalid-argument',
                'El formato del correo electrónico es inválido.'
            );
        } else if (error.code === 'auth/weak-password') {
            throw new functions.https.HttpsError(
                'invalid-argument',
                'La contraseña es demasiado débil.'
            );
        }
        // Error genérico
        throw new functions.https.HttpsError(
            'internal',
            `Error interno al crear usuario: ${error.message}`
        );
    }
});