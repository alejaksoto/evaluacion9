const express = require("express");
const bodyParser = require("body-parser");
const dotenv = require("dotenv");
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const cors = require("cors");
app.use(cors());
// Middleware
app.use(bodyParser.json());
app.use(express.static("frontend")); // Sirve el frontend desde esta carpeta
/***app.post('/register', async (req, res) => {
    try {
        const { companyName, webhookUrl } = req.body;

        if (!companyName || !webhookUrl) {
            return res.status(400).json({ error: 'Faltan datos requeridos (companyName o webhookUrl).' });
        }

        // Simulación: Guardar datos en una base de datos (ejemplo simple)
        console.log(`Registrando empresa: ${companyName}, Webhook: ${webhookUrl}`);

        // Respuesta al cliente
        res.status(201).json({
            message: 'Registro exitoso',
            data: { companyName, webhookUrl },
        });
    } catch (error) {
        console.error('Error en el registro:', error.message);
        res.status(500).json({ error: 'Ocurrió un error en el servidor.' });
    }
});**/

/*** Endpoint para webhooks
app.post("/webhook", (req, res) => {
  const { object, entry } = req.body;

  if (object === "whatsapp_business_account") {
    entry.forEach((change) => {
      if (change.changes && change.changes[0].field === "account_update") {
        const accountData = change.changes[0].value;
        console.log("Datos de cuenta actualizados:", accountData);

        // Aquí puedes procesar los datos y guardarlos en una base de datos
      }
    });
  }

  res.sendStatus(200); // Confirmar recepción del webhook
});**/

const axios = require('axios');

app.post('/webhook', async (req, res) => {
    const { object, entry } = req.body;

    if (object === "whatsapp_business_account") {
        entry.forEach(async (change) => {
            if (change.changes && change.changes[0].field === "messages") {
                const messages = change.changes[0].value.messages;

                if (messages && messages[0].type === "text") {
                    const fromNumber = messages[0].from; // Número de teléfono del usuario que envió el mensaje
                    const phoneId = change.changes[0].value.metadata.phone_number_id; // ID del número de prueba

                    try {
                        // Configurar la solicitud para enviar un mensaje de bienvenida
                        const response = await axios.post(
                            `https://graph.facebook.com/v17.0/${phoneId}/messages`,
                            {
                                messaging_product: "whatsapp",
                                to: fromNumber,
                                text: { body: "¡Hola! Bienvenido a nuestro servicio de pruebas de WhatsApp." },
                            },
                            {
                                headers: {
                                    Authorization: `Bearer ${process.env.WHATSAPP_API_TOKEN}`,
                                    "Content-Type": "application/json",
                                },
                            }
                        );

                        console.log("Mensaje de bienvenida enviado con éxito:", response.data);
                    } catch (error) {
                        console.error("Error al enviar el mensaje de bienvenida:", error.response?.data || error.message);
                    }
                }
            }
        });
    }

    res.sendStatus(200); // Confirmar recepción del webhook
});

app.post('/create-signup-link', async (req, res) => {
  const { businessName, vertical } = req.body;

  try {
    // Simular la lógica de creación del enlace
    console.log(`Simulando creación de enlace para ${businessName} (${vertical})`);

    // Simular una respuesta exitosa
    const simulatedResponse = {
      signup_url: `http://localhost:3000/simulated-signup-link/${businessName}`,
    };

    // Enviar respuesta simulada
    res.status(200).json(simulatedResponse);
  } catch (error) {
    console.error('Error al simular la creación del enlace:', error.message);
    res.status(500).json({
      error: 'Error al simular el enlace de registro.',
    });
  }
});


// Función para enviar el mensaje de bienvenida
const sendWelcomeMessage = async (phoneNumber, phoneId, apiToken) => {
  try {
    const url = `https://graph.facebook.com/v17.0/${phoneId}/messages`;

    const payload = {
      messaging_product: "whatsapp",
      to: phoneNumber,
      type: "text",
      text: {
        body: "Hola, este es un mensaje de master desde la API de WhatsApp.",
      },
    };

    const headers = {
      Authorization: `Bearer ${apiToken}`,
      "Content-Type": "application/json",
    };

    const response = await axios.post(url, payload, { headers });
    console.log("Mensaje de bienvenida enviado con éxito:", response.data);

    return { success: true, data: response.data };
  } catch (error) {
    console.error(
      "Error al enviar el mensaje de bienvenida:",
      error.response?.data || error.message
    );
    return { success: false, error: error.response?.data || error.message };
  }
};

// Endpoint para registrar la empresa
app.post("/register", async (req, res) => {
  try {
    const { companyName, webhookUrl, phoneNumber } = req.body;

    // Validar que se reciban todos los datos necesarios
    if (!companyName || !webhookUrl || !phoneNumber) {
      return res
        .status(400)
        .json({ error: "Faltan datos requeridos (companyName, webhookUrl o phoneNumber)." });
    }

    console.log(
      `Registrando empresa: ${companyName}, Webhook: ${webhookUrl}, Teléfono: ${phoneNumber}`
    );
    
    // Configurar los valores para el mensaje de bienvenida
    const phoneId = process.env.PHONE_NUMBER_ID; // Asegúrate de configurar esta variable en tu entorno
    const apiToken = process.env.API_TOKEN; // Asegúrate de configurar esta variable en tu entorno
    
   
    if (!phoneId || !apiToken) {
      return res.status(500).json({
        error: "No se configuraron correctamente las credenciales para el API de WhatsApp.",
      });
    }

    // Llamar a la función de envío de mensaje
    const messageResponse = await sendWelcomeMessage(phoneNumber, phoneId, apiToken);

    if (messageResponse.success) {
      return res.status(200).json({
        message: `La empresa '${companyName}' fue registrada exitosamente y el mensaje de bienvenida fue enviado.`,
      });
    } else {
      return res.status(500).json({
        error: "La empresa fue registrada, pero hubo un error al enviar el mensaje de bienvenida.",
        details: messageResponse.error,
      });
    }
  } catch (error) {
    console.error("Error en el registro:", error.message);
    res.status(500).json({ error: "Ocurrió un error en el servidor." });
  }
});




// Inicia el servidor
app.listen(PORT, () => console.log(`Servidor corriendo en http://localhost:${PORT}`));
