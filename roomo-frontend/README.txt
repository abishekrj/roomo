ROOMO Sacred — Shared HTML Site

Files
- code.html: Home page
- roomo-search-results.html: Search results page
- roomo-login.html: Sign-in page
- roomo-signup.html: Create-account page
- css/common.css: Shared styles, including the common homepage header/footer styling and the page-specific styles
- js/common.js: Shared interactions, search behavior, and sign-in/sign-up logic

How to run
1. Keep all six files in the same folder.
2. Open the folder through a local web server or upload the files to the same website directory. A local server is recommended because Firebase authentication and browser module loading can behave differently when opening files directly with file://.
3. Start from code.html. The search button opens roomo-search-results.html and carries the search fields in the URL.
4. The shared header contains working links to roomo-login.html and roomo-signup.html. The footer section links return to the relevant section on code.html.

Firebase setup
1. Open js/common.js.
2. At the top, replace YOUR_FIREBASE_API_KEY, YOUR_PROJECT_ID, and YOUR_FIREBASE_APP_ID with the Web App configuration from Firebase Console > Project settings > General > Your apps.
3. Enable the sign-in providers you intend to use in Firebase Authentication.
4. Add your deployed website's domain to Firebase Authentication's authorized domains.

Note: The provided property listings and prices are sample front-end data. This package does not connect the stay inventory to a live backend. Firebase authentication will not work until valid project configuration and provider settings are supplied.


Stay details page: roomo-stay-details.html. Click any search listing or its View rooms button to open the detail page. Listing photos, prices, ratings, amenities and review counts are illustrative sample data; availability is not connected to a booking inventory. Shared CSS lives in css/common.css and shared JavaScript lives in js/common.js.
