// Solo lectura general de partidos (matches). 
// Picks: cada usuario solo lee/escribe su propio pick (docId = matchdayId_userId).
// Users: cualquiera puede leer su doc; solo admin puede editar otros.

rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // PARTIDOS
    match /matches/{matchId} {
      allow read: if true;
      allow write: if false;
    }

    // PICKS (id = matchdayId_userId)
    match /picks/{pickId} {
      allow read: if request.auth != null && request.auth.uid == resource.data.userId;

      allow create, update: if request.auth != null
        && request.resource.data.userId == request.auth.uid
        && request.resource.data.id == pickId;

      allow delete: if false;
    }

    // USERS
    match /users/{uid} {
      allow read: if request.auth != null && request.auth.uid == uid;
      allow create: if request.auth != null && request.auth.uid == uid;
      allow update: if request.auth != null && request.auth.uid == uid;
    }
  }
}
