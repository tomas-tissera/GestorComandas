const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Inicializa Firebase Admin SDK (esto generalmente ya está configurado si usas firebase init)
admin.initializeApp();

// Exporta una función HTTPS Callable para crear un nuevo usuario
exports.createAppUser = functions.https.onCall(async (data, context) => {
    // --- Validación y Seguridad ---
    // 1. Asegúrate de que solo usuarios autenticados pueden llamar a esta función
    if (!context.auth) {
        throw new functions.https.HttpsError(
            'unauthenticated',
            'Debes estar autenticado para crear usuarios.'
        );
    }

    // 2. Opcional pero CRUCIAL: Asegúrate de que solo un gerente pueda crear usuarios
    //    Asume que tienes un 'custom claim' de 'role' en tus usuarios de Firebase Auth.
    //    Para que esto funcione, cuando un gerente se loguea, deberías establecerle un custom claim:
    //    admin.auth().setCustomUserClaims(gerenteUid, { role: 'gerente' });
    //    Y asegúrate de que el token se refresque para que el cliente lo tenga.
    if (context.auth.token.role !== 'gerente') {
        throw new functions.https.HttpsError(
            'permission-denied',
            'Solo los gerentes pueden crear nuevos usuarios.'
        );
    }

    // --- Obtener datos del request ---
    const { email, password, firstName, lastName, role } = data;

    // --- Validación de datos de entrada ---
    if (!email || !password || !firstName || !lastName || !role) {
        throw new functions.https.HttpsError(
            'invalid-argument',
            'Faltan campos requeridos: email, password, firstName, lastName, role.'
        );
    }
    if (password.length < 6) {
        throw new functions.https.HttpsError(
            'invalid-argument',
            'La contraseña debe tener al menos 6 caracteres.'
        );
    }
    const validRoles = ['mesero', 'cajero', 'cocinero', 'gerente'];
    if (!validRoles.includes(role)) {
        throw new functions.https.HttpsError(
            'invalid-argument',
            'Rol no válido. Los roles permitidos son: mesero, cajero, cocinero, gerente.'
        );
    }

    try {
        // 3. Crear el usuario en Firebase Authentication (Admin SDK)
        //    Esta función NO loguea automáticamente al usuario recién creado.
        const userRecord = await admin.auth().createUser({
            email: email,
            password: password,
            displayName: `${firstName} ${lastName}`, // Opcional, pero útil
            // emailVerified: true, // Considera si quieres verificar el email al crear
        });

        // 4. Establecer el custom claim del rol para el nuevo usuario
        await admin.auth().setCustomUserClaims(userRecord.uid, { role: role });

        // 5. Guardar información adicional del usuario en Firestore
        await admin.firestore().collection('users').doc(userRecord.uid).set({
            firstName: firstName,
            lastName: lastName,
            email: email,
            role: role,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        // 6. Retornar éxito al cliente
        return { success: true, message: `Usuario ${firstName} <span class="math-inline">\{lastName\} \(</span>{email}) creado exitosamente.` };

    } catch (error) {
        // Manejo de errores específicos de Firebase Auth y Firestore
        if (error.code === 'auth/email-already-in-use') {
            throw new functions.https.HttpsError('already-exists', 'El correo electrónico ya está en uso.');
        } else if (error.code === 'auth/invalid-email') {
            throw new functions.https.HttpsError('invalid-argument', 'El formato del correo electrónico no es válido.');
        } else if (error.code === 'auth/weak-password') {
            throw new functions.https.HttpsError('invalid-argument', 'La contraseña es demasiado débil.');
        } else {
            console.error("Error al crear usuario en Cloud Function:", error);
            throw new functions.https.HttpsError(
                'internal',
                error.message || 'Ocurrió un error inesperado al crear el usuario.'
            );
        }
    }
});