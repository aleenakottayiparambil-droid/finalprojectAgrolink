
/* ================================
   LOAD FARMER INFORMATION
================================ */

const userData = localStorage.getItem("agrolink_user");

if (!userData) {
    window.location.href = "index.html";
} else {
    try {
        const user = JSON.parse(userData);

        if (user.role !== "farmer") {
            window.location.href = "index.html";
        } else {
            document.getElementById("farmerName").textContent =
                "Welcome, " + user.full_name;

            document.getElementById("profileName").textContent =
                user.full_name;

            loadFarmerStatistics();
        }
    } catch (error) {
        console.error("Error reading farmer information:", error);
        window.location.href = "index.html";
    }
}


/* ================================
   LOGOUT
================================ */

const logoutBtn = document.getElementById("logoutBtn");

if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
        localStorage.removeItem("agrolink_token");
        localStorage.removeItem("agrolink_user");

        window.location.href = "index.html";
    });
}


/* ================================
   LOAD FARMER STATISTICS
================================ */

async function loadFarmerStatistics() {
    const token = localStorage.getItem("agrolink_token");

    if (!token) {
        window.location.href = "index.html";
        return;
    }

    try {
        // Get farmer's products
        const productsResponse = await fetch(
            "http://localhost:5000/api/products/farmer",
            {
                method: "GET",
                headers: {
                    Authorization: "Bearer " + token
                }
            }
        );

        const productsData = await productsResponse.json();

        if (productsResponse.ok && productsData.success) {
            const products = productsData.products || [];

            document.getElementById("totalProducts").textContent =
                products.length;
        }

        // Get farmer's orders
        const ordersResponse = await fetch(
            "http://localhost:5000/api/orders/farmer",
            {
                method: "GET",
                headers: {
                    Authorization: "Bearer " + token
                }
            }
        );

        const ordersData = await ordersResponse.json();

        if (ordersResponse.ok && ordersData.success) {
            const orders = ordersData.orders || [];

            // Count pending/in-progress orders
            const pendingOrders = orders.filter(order =>
                ["placed", "confirmed", "processing", "shipped"].includes(
                    String(order.order_status || "").toLowerCase()
                )
            );

            document.getElementById("pendingOrders").textContent =
                pendingOrders.length;

            // Calculate earnings from paid orders
            const totalEarnings = orders.reduce((total, order) => {
                if (
                    String(order.payment_status || "").toLowerCase() !== "paid"
                ) {
                    return total;
                }

                return total + Number(
                    order.subtotal ?? order.total_amount ?? 0
                );
            }, 0);

            document.getElementById("totalEarnings").textContent =
                "₹" + totalEarnings.toFixed(2);

            // Calculate quantity sold
            const productsSold = orders.reduce((total, order) => {
                return total + Number(order.quantity || 0);
            }, 0);

            document.getElementById("productsSold").textContent =
                productsSold;
        }
    } catch (error) {
        console.error("Error loading farmer statistics:", error);
    }
}


/* ================================
   CROP DISEASE DETECTION
================================ */

const diseaseSection = document.getElementById(
    "diseaseDetectionSection"
);

const diseaseForm = document.getElementById("diseaseForm");
const cropImageInput = document.getElementById("cropImage");

const imagePreviewContainer = document.getElementById(
    "imagePreviewContainer"
);

const imagePreview = document.getElementById("imagePreview");

const detectDiseaseBtn = document.getElementById(
    "detectDiseaseBtn"
);

const diseaseStatus = document.getElementById("diseaseStatus");
const diseaseResult = document.getElementById("diseaseResult");

const predictedDisease = document.getElementById("predictedDisease");

const diseaseConfidence = document.getElementById(
    "diseaseConfidence"
);

// Grad-CAM heatmap image
const gradcamImage = document.getElementById("gradcamImage");

// Text-based XAI explanation
const xaiExplanation = document.getElementById("xaiExplanation");


/* ================================
   OPEN DISEASE DETECTION SECTION
================================ */

function openDiseaseDetection() {
    if (!diseaseSection) {
        console.error("Disease detection section was not found.");
        return;
    }

    diseaseSection.hidden = false;

    diseaseSection.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
}


// Sidebar button
const diseaseNavBtn = document.getElementById("diseaseNavBtn");

if (diseaseNavBtn) {
    diseaseNavBtn.addEventListener("click", openDiseaseDetection);
}


// Quick Actions button
const diseaseQuickBtn = document.getElementById("diseaseQuickBtn");

if (diseaseQuickBtn) {
    diseaseQuickBtn.addEventListener("click", openDiseaseDetection);
}


/* ================================
   CLEAR PREVIOUS RESULTS
================================ */

function clearDiseaseResults() {
    if (diseaseResult) {
        diseaseResult.hidden = true;
    }

    if (gradcamImage) {
        gradcamImage.onload = null;
        gradcamImage.onerror = null;
        gradcamImage.removeAttribute("src");
        gradcamImage.hidden = true;
    }

    if (xaiExplanation) {
        xaiExplanation.textContent =
            "The text explanation will appear here after the disease prediction is completed.";
    }
}


/* ================================
   IMAGE PREVIEW AND VALIDATION
================================ */

if (cropImageInput) {
    cropImageInput.addEventListener("change", () => {
        const file = cropImageInput.files[0];

        clearDiseaseResults();

        if (diseaseStatus) {
            diseaseStatus.textContent = "";
        }

        if (!file) {
            imagePreviewContainer.hidden = true;
            imagePreview.removeAttribute("src");
            return;
        }

        if (!file.type.startsWith("image/")) {
            diseaseStatus.textContent =
                "Please select a valid image file.";

            cropImageInput.value = "";
            imagePreviewContainer.hidden = true;
            imagePreview.removeAttribute("src");
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            diseaseStatus.textContent =
                "Image size must be less than 5 MB.";

            cropImageInput.value = "";
            imagePreviewContainer.hidden = true;
            imagePreview.removeAttribute("src");
            return;
        }

        // Revoke the previous preview URL to avoid unnecessary memory use
        if (imagePreview.dataset.previewUrl) {
            URL.revokeObjectURL(imagePreview.dataset.previewUrl);
        }

        const previewUrl = URL.createObjectURL(file);

        imagePreview.dataset.previewUrl = previewUrl;
        imagePreview.src = previewUrl;
        imagePreviewContainer.hidden = false;
    });
}


/* ================================
   CROP DISEASE PREDICTION
================================ */

if (diseaseForm) {
    diseaseForm.addEventListener("submit", async event => {
        event.preventDefault();

        const file = cropImageInput.files[0];

        if (!file) {
            diseaseStatus.textContent =
                "Please select a crop leaf image first.";
            return;
        }

        if (!file.type.startsWith("image/")) {
            diseaseStatus.textContent =
                "Please select a valid image file.";
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            diseaseStatus.textContent =
                "Image size must be less than 5 MB.";
            return;
        }

        const formData = new FormData();
        formData.append("image", file);

        detectDiseaseBtn.disabled = true;
        detectDiseaseBtn.textContent = "Analyzing Image...";

        diseaseStatus.textContent =
            "Please wait while the AI model analyzes your crop image.";

        clearDiseaseResults();

        try {
            // Send the image to the Node.js backend
            const response = await fetch(
                "http://localhost:5000/api/disease/predict",
                {
                    method: "POST",
                    body: formData
                }
            );

            let data;

            try {
                data = await response.json();
            } catch {
                throw new Error(
                    "The server returned an invalid response. Check that the backend is running."
                );
            }

            if (!response.ok || !data.success) {
                throw new Error(
                    data.message || "Disease prediction failed."
                );
            }

            // Validate prediction details
            if (
                typeof data.predicted_class !== "string" ||
                typeof data.confidence !== "number"
            ) {
                throw new Error(
                    "The disease detection service returned an invalid prediction."
                );
            }

            // Validate Grad-CAM image
            if (
                typeof data.gradcam_image !== "string" ||
                !data.gradcam_image.startsWith("data:image/png;base64,")
            ) {
                throw new Error(
                    "Prediction was received, but the Grad-CAM image is missing. Please try again."
                );
            }

            // Format the predicted class for display
            const readableDisease = data.predicted_class
                .replace(/___/g, " - ")
                .replace(/_/g, " ");

            predictedDisease.textContent = readableDisease;

            diseaseConfidence.textContent =
                data.confidence.toFixed(2) + "%";

            // Display text-based XAI explanation
            if (xaiExplanation) {
                xaiExplanation.textContent =
                    typeof data.explanation === "string" &&
                    data.explanation.trim()
                        ? data.explanation
                        : "The CNN predicted " + readableDisease +
                          " with a prediction score of " +
                          data.confidence.toFixed(2) +
                          "%. The Grad-CAM heatmap shows image regions that influenced the model's prediction. It does not independently confirm the disease or identify exact symptoms. The text explanation has not been received from the server.";
            }

            // Display Grad-CAM heatmap
            gradcamImage.onload = () => {
                gradcamImage.hidden = false;
            };

            gradcamImage.onerror = () => {
                gradcamImage.hidden = true;

                diseaseStatus.textContent =
                    "Prediction completed, but the Grad-CAM image could not be displayed.";
            };

            gradcamImage.src = data.gradcam_image;

            // Show prediction, text explanation, and heatmap together
            diseaseResult.hidden = false;

            diseaseStatus.textContent =
                "Image analysis completed successfully.";

        } catch (error) {
            console.error("Disease detection error:", error);

            diseaseStatus.textContent =
                error.message ||
                "Unable to detect the disease. Ensure the Node.js backend and Python disease detection API are running, then try again.";

        } finally {
            detectDiseaseBtn.disabled = false;
            detectDiseaseBtn.textContent = "Detect Disease";
        }
    });
}
