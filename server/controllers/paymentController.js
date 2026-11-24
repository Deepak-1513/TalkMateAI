
import "dotenv/config";
import Razorpay from "razorpay";
import crypto from "crypto";

// Razorpay instance
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});

// Create Order
export const createOrder = async (req, res) => {
    try {
        const options = {
            amount: 10000, // ₹100 (amount in paise)
            currency: "INR",
            receipt: "receipt_" + Date.now()
        };
        const order = await razorpay.orders.create(options);

        return res.status(200).json({
            success: true,
            order
        });

    } catch (error) {
        console.log("Order Creation Error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to create order"
        });
    }
};


// Verify Payment
export const verifyPayment = async (req, res) => {
    try {

        // Step 1: Get payment details from frontend
        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature
        } = req.body;


        // Step 2: Validate input
        if (
            typeof razorpay_order_id !== "string" ||
            typeof razorpay_payment_id !== "string" ||
            typeof razorpay_signature !== "string" ||
            !razorpay_order_id ||
            !razorpay_payment_id ||
            !razorpay_signature
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid payment details"
            });
        }


        // Step 3: Validate signature format
        if (!/^[a-f0-9]{64}$/i.test(razorpay_signature)) {
            return res.status(400).json({
                success: false,
                message: "Invalid signature format"
            });
        }


        // Step 4: Generate expected signature
        const body = razorpay_order_id + "|" + razorpay_payment_id;

        const expectedSignature = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(body)
            .digest("hex");

             
            // if(expectedSignature===razorpay_signature){

            // }

            
        // Step 5: Compare signatures securely
        const expectedBuffer = Buffer.from(expectedSignature, "hex");
        const receivedBuffer = Buffer.from(razorpay_signature, "hex");

        if (
            expectedBuffer.length !== receivedBuffer.length ||
            !crypto.timingSafeEqual(expectedBuffer, receivedBuffer)
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid payment signature"
            });
        }


        // Step 6: Fetch actual payment details from Razorpay
        const payment = await razorpay.payments.fetch(
            razorpay_payment_id
        );


        // Step 7: Verify payment details
        if (
            payment.order_id !== razorpay_order_id ||
            payment.status !== "captured" ||
            payment.amount !== 10000 ||
            payment.currency !== "INR"
        ) {
            return res.status(400).json({
                success: false,
                message: "Payment not completed or details mismatch"
            });
        }


        // Step 8: Payment successful
        return res.status(200).json({
            success: true,
            message: "Payment verified successfully"
        });


    } catch (error) {
        console.log("Payment Verification Error:", error);

        return res.status(500).json({
            success: false,
            message: "Payment verification failed"
        });
    }
};
