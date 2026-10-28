/* =========================
   GLOBAL VARIABLES
========================= */

let loginRole = "farmer";
let registerRole = "farmer";


/* =========================
   LOGIN ROLE
========================= */

function selectLoginRole(role) {

    loginRole = role;

    const farmer =
        document.getElementById("farmerRole");

    const consumer =
        document.getElementById("consumerRole");

    const button =
        document.getElementById("loginButton");


    farmer.classList.remove("active");
    consumer.classList.remove("active");


    if (role === "farmer") {

        farmer.classList.add("active");

        button.textContent =
            "Continue as Farmer →";

    } else {

        consumer.classList.add("active");

        button.textContent =
            "Continue as Consumer →";
    }
}


/* =========================
   REGISTER ROLE
========================= */

function selectRegisterRole(role) {

    registerRole = role;

    const farmer =
        document.getElementById("registerFarmerRole");

    const consumer =
        document.getElementById("registerConsumerRole");

    const button =
        document.getElementById("registerButton");


    farmer.classList.remove("active");
    consumer.classList.remove("active");


    if (role === "farmer") {

        farmer.classList.add("active");

        button.textContent =
            "Create Farmer Account →";

    } else {

        consumer.classList.add("active");

        button.textContent =
            "Create Consumer Account →";
    }
}


/* =========================
   SHOW LOGIN
========================= */

function showLogin() {

    const loginCard =
        document.getElementById("loginCard");

    const registerCard =
        document.getElementById("registerCard");


    registerCard.style.display = "none";
    loginCard.style.display = "block";
}


/* =========================
   SHOW REGISTER
========================= */

function showRegister() {

    const loginCard =
        document.getElementById("loginCard");

    const registerCard =
        document.getElementById("registerCard");


    loginCard.style.display = "none";
    registerCard.style.display = "block";
}


/* =========================
   SCROLL TO LOGIN
========================= */

function scrollToLogin() {

    document
        .getElementById("login")
        .scrollIntoView({
            behavior: "smooth"
        });
}


/* =========================
   SHOW FEATURES
========================= */

function showFeatures() {

    document
        .getElementById("features")
        .scrollIntoView({
            behavior: "smooth"
        });
}


/* =========================
   LOGIN FORM
========================= */

document
    .getElementById("loginForm")
    .addEventListener("submit", async function (event) {

        event.preventDefault();


        const email =
            document
                .getElementById("loginEmail")
                .value
                .trim();

        const password =
            document
                .getElementById("loginPassword")
                .value;


        /* Check empty fields */

        if (email === "" || password === "") {

            alert(
                "Please enter your email and password."
            );

            return;
        }


        /* =========================
           SEND LOGIN REQUEST
        ========================= */

        try {

            const response =
                await fetch(
                    "http://localhost:5000/api/auth/login",
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body: JSON.stringify({

                            email: email,

                            password: password,

                            role: loginRole

                        })
                    }
                );


            const data =
                await response.json();


            /* =========================
               LOGIN SUCCESS
            ========================= */

            if (data.success) {

                alert(
                    "Welcome, " +
                    data.user.full_name +
                    "!"
                );


                /*
                 * Store login information
                 * temporarily in browser
                 */

                localStorage.setItem(
                    "agrolink_token",
                    data.token
                );

                localStorage.setItem(
                    "agrolink_user",
                    JSON.stringify(data.user)
                );


                console.log(
                    "Logged in user:",
                    data.user
                );

                if (data.user.role === "farmer") {
    window.location.href = "farmer.html";
} else if (data.user.role === "consumer") {
    window.location.href = "consumer.html";
}


                /*
                 * Dashboard navigation
                 * will be added in the next step.
                 */

            }


            /* =========================
               LOGIN FAILED
            ========================= */

            else {

                alert(
                    data.message ||
                    "Login failed."
                );

            }


        } catch (error) {

            console.error(
                "Login error:",
                error
            );

            alert(
                "Unable to connect to the server. " +
                "Please make sure the backend is running."
            );

        }

    });

/* =========================
   REGISTER FORM
========================= */
/* =========================
   REGISTER FORM
========================= */

document
    .getElementById("registerForm")
    .addEventListener("submit", async function (event) {

        event.preventDefault();


        const name =
            document
                .getElementById("registerName")
                .value
                .trim();

        const email =
            document
                .getElementById("registerEmail")
                .value
                .trim();

        const phone =
            document
                .getElementById("registerPhone")
                .value
                .trim();

        const password =
            document
                .getElementById("registerPassword")
                .value;

        const confirmPassword =
            document
                .getElementById("confirmPassword")
                .value;


        /* Check empty fields */

        if (
            name === "" ||
            email === "" ||
            phone === "" ||
            password === "" ||
            confirmPassword === ""
        ) {

            alert(
                "Please fill in all the fields."
            );

            return;
        }


        /* Check password */

        if (password.length < 6) {

            alert(
                "Password must contain at least 6 characters."
            );

            return;
        }


        /* Check password match */

        if (password !== confirmPassword) {

            alert(
                "Passwords do not match."
            );

            return;
        }


        /* =========================
           SEND DATA TO BACKEND
        ========================= */

        try {

            const response =
                await fetch(
                    "http://localhost:5000/api/auth/register",
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body: JSON.stringify({

                            full_name: name,

                            email: email,

                            phone: phone,

                            password: password,

                            role: registerRole

                        })
                    }
                );


            const data =
                await response.json();


            /* =========================
               SUCCESS
            ========================= */

            if (data.success) {

                alert(
                    "Account created successfully!"
                );


                document
                    .getElementById("registerForm")
                    .reset();


                showLogin();

            }


            /* =========================
               ERROR
            ========================= */

            else {

                alert(
                    data.message ||
                    "Registration failed."
                );

            }


        } catch (error) {

            console.error(
                "Registration error:",
                error
            );

            alert(
                "Unable to connect to the server. " +
                "Please make sure the backend is running."
            );

        }

    });