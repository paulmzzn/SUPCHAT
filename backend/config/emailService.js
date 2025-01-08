import Mailjet from 'node-mailjet';

const mailjetClient = Mailjet.apiConnect('869c3107124e8fe05a924c67754b44ae', '0849821df2342b4415f277ceb3912daa');

const sendInvitation = async (toEmail, chatRoomName, senderName) => {
    try {
        const request = await mailjetClient.post("send", { version: "v3.1" }).request({
            Messages: [
                {
                    From: {
                        Email: "paul.mazzon@gmail.com",
                        Name: "Chat App",
                    },
                    To: [
                        {
                            Email: toEmail,
                            Name: "Recipient",
                        },
                    ],
                    Subject: `Invitation to join ${chatRoomName}`,
                    TextPart: `${senderName} has invited you to join the chat room: ${chatRoomName}.`,
                    HTMLPart: `<p>${senderName} has invited you to join the chat room: <strong>${chatRoomName}</strong>.</p><p><a href="https://your-chat-app.com/rooms/${chatRoomName}">Join now</a></p>`,
                },
            ],
        });
        console.log('Email sent:', request.body);
    } catch (error) {
        console.error(`Error sending email: ${error.message}`);
    }
};

export default sendInvitation;