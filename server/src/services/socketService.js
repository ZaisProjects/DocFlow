import { Server } from 'socket.io';
import Document from '../models/Document.js';


// Socket.IO initialization
export function initializeSocket(server) {

    const io = new Server(server, {
    cors: {
      origin: [
        'http://localhost:5173',
        process.env.CLIENT_URL,
      ],
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    },
  });

    // documentId -> Map(socketId -> user)
    const documentPresence = new Map();

    // Stores pending MongoDB saves
    const pendingDocumentSaves = new Map();

    io.on('connection', socket => {

        // Join document room
        socket.on('join-document', async ({ documentId, user }) => {
            try {
            const document = await Document.findById(documentId);

            if (!document || document.isDeleted) {
                socket.emit('document-error', {
                message: 'Document not found',
                });
                return;
            }

            socket.join(documentId);

            socket.documentId = documentId;
            socket.user = user;
            socket.userId = String(user.id);

            // Determine permission once when joining
            let editPermission = 'viewer';
            
            // owner
            if (document.owner.toString() === String(user.id)) {
                editPermission = 'owner';
            } 
            else {
                //collaborator
                const collaborator = document.collaborators.find(
                c => c.user.toString() === String(user.id)
                );

                if (collaborator && collaborator.role === 'editor') {
                    editPermission = 'editor';
                }
            }

            // Store permission in socket memory
            socket.editPermission = editPermission;

            // Presence
            if (!documentPresence.has(documentId)) {
                documentPresence.set(documentId, new Map());
            }

            documentPresence
                .get(documentId)
                .set(socket.id, user);

            const onlineUsers = Array.from(
                documentPresence
                .get(documentId)
                .values()
            );

            io.to(documentId).emit(
                'presence-update',
                onlineUsers
            );

            // Load document
            socket.emit('load-document', {
                content: document.content,
            });

            } catch (error) {
            console.error(
                'Join document error:',
                error.message
            );

            socket.emit('document-error', {
                message: 'Unable to join document',
            });
            }
        });

            // Realtime document changes
        socket.on('document-change', async data => {
            try {
            const { documentId, content } = data;

            // Make sure this socket actually joined this document
            if (socket.documentId !== documentId) {
                return;
            }

            // Permission was determined when joining
            const canEdit =
                socket.editPermission === 'owner' ||
                socket.editPermission === 'editor';

            if (!canEdit) {
                socket.emit('edit-denied', {
                message: 'You have view-only access',
                });
                return;
            }

            // REAL-TIME BROADCAST
            socket.to(documentId).emit(
                'receive-document-change',
                {
                content,
                }
            );


            // DEBOUNCED MONGODB SAVE
            const existingSave =
                pendingDocumentSaves.get(documentId);

            if (existingSave) {
                clearTimeout(existingSave.timer);
            }

            const timer = setTimeout(async () => {
                try {
                const latestSave =
                    pendingDocumentSaves.get(documentId);

                if (!latestSave) {
                    return;
                }

                const latestDocument =
                    await Document.findById(documentId);

                if (
                    !latestDocument ||
                    latestDocument.isDeleted
                ) {
                    pendingDocumentSaves.delete(documentId);
                    return;
                }

                // save latest content
                latestDocument.content =
                    latestSave.content;

                latestDocument.lastEditedBy =
                    latestSave.userId;

                latestDocument.lastEditedAt =
                    new Date();

                await latestDocument.save();

                pendingDocumentSaves.delete(documentId);

                } catch (error) {
                console.error(
                    'Debounced MongoDB save error:',
                    error.message
                );
                }
            }, 700);

            pendingDocumentSaves.set(documentId, {
                content,
                userId: socket.userId,
                timer,
            });

            } catch (error) {
            console.error(
                'Realtime document error:',
                error.message
            );
            }
        });

        socket.on('typing-start', ({ documentId, name }) => {
            socket.to(documentId).emit('user-typing', {
            socketId: socket.id,
            name,
            });
        });

        socket.on('typing-stop', ({ documentId }) => {
            socket.to(documentId).emit('user-stop-typing', {
            socketId: socket.id,
            });
        });

        // Disconnect cleanup
        socket.on('disconnect', () => {
            const documentId = socket.documentId;

            if(documentId && documentPresence.has(documentId)) {

                documentPresence.get(documentId).delete(socket.id);

                const onlineUsers = Array.from(
                    documentPresence.get(documentId).values()
                );

                io.to(documentId).emit('presence-update', onlineUsers);

                if (documentPresence.get(documentId).size === 0) {
                    documentPresence.delete(documentId);
                }
            }

        });
    });
  return io;
}