import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

admin.initializeApp();
const db = admin.firestore();

export const testing = functions.https.onRequest(async (req, res) => {
  try {
    const shipmentsSnapshot = await db.collection("shipments").get();

    const shipmentsData = await Promise.all(shipmentsSnapshot.docs
      .map(async (shipmentDoc) => {
        const shipmentData = shipmentDoc.data();
        const totalOrderQuantity = shipmentData.orders
          .reduce((acc: any, order: any) => acc + order.quantity, 0);
        let totalShipmentPrice = 0;

        for (const order of shipmentData.orders) {
          const orderSnapshot = await db.collection("orders")
            .doc(order.orderId).get();
          if (orderSnapshot.exists) {
            const orderData = orderSnapshot.data();
            totalShipmentPrice += orderData?.price * order.quantity;
          }
        }

        // Return shipment data with additional calculated fields
        return {
          ...shipmentData,
          totalOrderQuantity,
          totalShipmentPrice,
        };
      }));

    res.set("Access-Control-Allow-Origin", "*");
    res.status(200).json({
      totalShipments: shipmentsSnapshot.size,
      shipments: shipmentsData,
    });
  } catch (error) {
    console.error("Error processing shipments:", error);
    res.status(500).json({error: "Failed to process shipments"});
  }
});
