const homepageDefaults = {
  pilgrimGuide: {
    enabled: true,
    eyebrow: "Pilgrim Compendium",
    title: "Sacred Traditions of Tiruvannamalai",
    description: "Practical instructions for sacred circumambulation, cave meditation, and Agni darshan.",
    cards: [
      { label: "Holy Pradakshina", icon: "bi-compass", title: "14 km Girivalam Path", description: "Circumambulate holy Mount Arunachala barefoot in a clockwise path. Visit the eight guardian Shiva Shrines (Ashta Lingams) aligned with cardinal cosmic directions.", badge: "Duration: 3.5 to 4.5 hours", badgeIcon: "bi-clock-history" },
      { label: "Cave Meditation", icon: "bi-flower1", title: "Sacred Caves & Ashrams", description: "Explore the quiet meditation spaces around Arunachala, including Virupaksha Cave, Skandashramam and Sri Ramanasramam.", badge: "Keep the silence", badgeIcon: "bi-heart" },
      { label: "Agni Darshan", icon: "bi-brightness-high", title: "Annamalaiyar Temple", description: "Plan a respectful temple visit and learn about the sacred significance of Arunachala, the Agni Sthalam.", badge: "Check temple timings", badgeIcon: "bi-calendar-check" }
    ]
  },
  featuredSectionTitle: "Revered Pilgrim Sanctuaries",
  featuredSectionDescription: "Peaceful sanctuaries vetted for silence, cleanliness, and proximity to divine spots.",
  featuredRooms: [
    { id: "arunachala-inn", name: "Hotel Arunachala Inn", type: "Ashrams & Retreats", location: "Near Sri Ramanasramam · approx. 250 m", rating: 4.7, reviews: 218, price: 1499, img: "https://lh3.googleusercontent.com/aida-public/AB6AXuCjpc5VPAMnHiuVZYecSqsGXduU5_IYHeTf1gvafNWk_-2v4ZukH2uGS0UwNFg82hH2MBsBcdYqILpnRrCg78WVbhWST6XAult6PXFOIaKEKsZQ8i8giCIcI-rzHW9GT0XCqsuDdTvgKIRcV-742qVjUGGRxeiguUW6zze2ZI9eJ1KrKmqWUw5dTOsKapa3S7W49QFd3GbrZ8Xu31eXb-TR4lZJGNxQYCobfsajAOPmss-aYLHBe_sO", desc: "A calm retreat with a private balcony and views towards Arunachala.", featured: true, sortOrder: 1 },
    { id: "siva-shakti", name: "Siva Shakti Residency", type: "Vedic Mathas & Inns", location: "Main Road · approx. 400 m to Annamalaiyar Temple", rating: 4.5, reviews: 164, price: 999, img: "https://lh3.googleusercontent.com/aida-public/AB6AXuDpVPQUgrreK3-w52kGqfySHt3p4P_o2eomIUFBsPbIiNzO7PGfY1nax8_hE7dHBI5XX_SzpXadxmUVPAg6glztmRM38ZSV0X2N2Fv75NKSsh2PEDnEt04fCiPjwl57BbtgggVhXg2VTCyT3OJvUBwCwet7mVe_uHxWrSTaSepeJa3ShWSGwhdEVZJZbUjtAwvSoLmbSVP1iFB1h22Q0KYCqIltZy2MxwETHUmSdpsvw0G8wFllTF9H", desc: "A convenient, welcoming base for early morning darshan and temple visits.", featured: true, sortOrder: 2 },
    { id: "annamalai-guesthouse", name: "Annamalai Guest House", type: "Vedic Mathas & Inns", location: "Near Central Bus Stand & Market", rating: 4.3, reviews: 96, price: 799, img: "https://lh3.googleusercontent.com/aida-public/AB6AXuBhbXOK_PdyukniK0zeTSMc68JxxLC5_9pxdDmm0GxlKxz9NHxuIY4qnupzjaG3Y9aqgWzNwdm_jd_f-CzxFdVYReFnpuOgQ0h_8M_Kn1pi0o88UilLiKYFlsOImdfJY3O3MYPjHX9_lYRAETY0XWnFy5EtwNNIoW0AKJf-caWykUtHB5MqbJarLBR3ROdzn2GtsV6MDF20gGbtbAHn5Id7LMNzEmesrj3vjKAwQ57cFX98lGDuD72L", desc: "Simple, peaceful rooms with easy transport access and hot water.", featured: true, sortOrder: 3 },
    { id: "ramana-heritage", name: "Ramana Heritage Stays", type: "Heritage Haveli Homes", location: "Girivalam Road · panoramic Arunachala hill view", rating: 4.8, reviews: 143, price: 2199, img: "https://lh3.googleusercontent.com/aida-public/AB6AXuBJ3ru1MFLx8fXh0zDW7gWD7RMLKSGXvUrctcltCm9QVI5ua8pmjo5JOGy-l_zUNqLaOuink7ezYaZd-I8qpRTfzn_nkfn7WBZbjt2Vx6TcfmgEh1zTSqN65Co21DVQB6sGM-T2qqLI2D9kDqH8C2QqWevYBJc0KdO93q9cb68SZf4CHicPJJV440iIFp9YgAkGnIN8he_ZVH-uyXlSwJUPqwDbmqBj5t8_5Gz3zuBM40QmjpMqvRHs", desc: "A heritage-inspired stay beside the sacred circumambulation path.", featured: true, sortOrder: 4 },
    { id: "temple-view-suites", name: "Arunachala Temple View Suites", type: "Temple View Suites", location: "Temple district · convenient darshan access", rating: 4.6, reviews: 87, price: 1799, img: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=900&q=80", desc: "Comfortable suites for devotees seeking a convenient temple-district stay.", featured: true, sortOrder: 5 },
    { id: "agni-theertham-haveli", name: "Agni Theertham Haveli", type: "Heritage Haveli Homes", location: "Tiruvannamalai · peaceful heritage neighbourhood", rating: 4.9, reviews: 112, price: 2499, img: "https://lh3.googleusercontent.com/aida-public/AB6AXuBXtxCnBzRiU8d5Qigy_OG6WAAzgDWLqUvqg20izQ2cqA7lgJOctKf2KLOe3knicN5-cDtuWa4hmVn-Tw8jrI3dmbFMzpu61c0fqk4x2xBvAk8AzLbPflWc5Ufu4Tnxvlp-FqLCVwySU_X6SuSobKQmr1KgIHHCpppWcWezUk6ZHoFf5RmdR3M1mtDHtLDbvcFtF2V8NxLt3nJiNCb9jGpKl2enX0uyzIYk30cFu4MX5tb4Y5OeOtGC", desc: "A heritage-inspired haveli with calm courtyard spaces for pilgrims to unwind between temple visits.", featured: true, sortOrder: 6 }
  ],
  siteTitle: "ROOMO Sacred | Tiruvannamalai Heritage Stays & Temple Retreats",
  heroBadge: "Abode of Silence & Divine Fire (Agni Sthalam)",
  heroTitleLine: "Find Sacred Solace at",
  heroTitleAccent: "Holy Arunachala",
  heroDescription: "Hand-curated sanctuary stays, peaceful ashram guest rooms, and heritage havelis situated in revered proximity to Annamalaiyar Temple & Sri Ramanasramam.",
  heroImageUrl: "https://lh3.googleusercontent.com/aida/AEtjO1WPqpw7U-3cK3DXCWtQksdvMd_FQT7Rln8b36_TSmYoqFe_eoL-rZTeovlHRw4_W7FTImYN5QacCN-1Cz14CYXGLt86TlJglU6w9p0m_aon-hpDBhxdS8xRvjZ_UKVSjjmzDRlYBzMlKmPFnt3Xn6skMZ9EGrQA8ktbnSt1NSIYOsb58ERgJrMAl7HfibYOkZFXHDc94lf5tOduqxrlZW6NqVJjEpshssz6wkLAr39DOdQTOhry7YUfHg",
  pournamiItems: [{"eyebrow":"FULL MOON GIRIVALAM","title":"Walk Around Arunachala","description":"A sacred 14-km hill circuit."},{"eyebrow":"ANNAMALAIYAR TEMPLE","title":"Plan Your Darshan","description":"Visit the grand Arunachaleswarar Temple."},{"eyebrow":"SRI RAMANASRAMAM","title":"Find Quietude","description":"Pause in the ashram’s serene setting."},{"eyebrow":"ARUNACHALA HILL","title":"Sacred Hill Views","description":"Take in the presence of holy Arunachala."},{"eyebrow":"KARTHIGAI DEEPAM","title":"Plan Your Festival Stay","description":"Reserve early for the Deepam season."}],
  festivalTitle: "Karthigai Deepam 🪔",
  festivalDescription: "Behold the sacred Maha Deepam cauldron ignited high atop Arunachala mountain summit. Verified heritage sanctuaries near Eastern Rajagopuram fill months in advance. Secure peaceful stays with complimentary temple shuttle passes.",
  festivalDate: "2026-11-26T18:00:00+05:30",
  footerDescription: "Stay Blessed, Stay Serene. ROOMO Sacred is your devoted hospitality companion in holy Tiruvannamalai. We hand-vet every retreat to guarantee quietude, sattvic cleanliness, and authentic sacred warmth.",
  contactPhone: "+91 94440 00000",
  whatsappNumber: "919444000000",
  seoDescription: "Discover peaceful heritage stays, ashrams and temple-view retreats in Tiruvannamalai with ROOMO Sacred.",
  footerLinks: {
    social: [{ label: "Facebook", url: "#", icon: "bi-facebook" }, { label: "Instagram", url: "#", icon: "bi-instagram" }, { label: "WhatsApp", url: "https://wa.me/919444000000", icon: "bi-whatsapp" }, { label: "YouTube", url: "#", icon: "bi-youtube" }],
    sanctuaries: [{ label: "Hotels Near Arunachaleswarar Temple", url: "hotels-near-arunachaleswarar-temple.html" }, { label: "Stays Near Sri Ramanasramam", url: "stays-near-sri-ramanasramam.html" }, { label: "Budget Rooms in Tiruvannamalai", url: "budget-rooms-in-tiruvannamalai.html" }, { label: "Family Stays for Girivalam", url: "family-stays-for-girivalam.html" }, { label: "Monthly Stays in Tiruvannamalai", url: "monthly-stays-in-tiruvannamalai.html" }],
    pilgrimCare: [{ label: "Karthigai Deepam 2026 Passes", url: "index.html#karthigaiPromo" }, { label: "Pournami Girivalam Calendar", url: "index.html#spiritualGuide" }, { label: "Annamalaiyar Darshan Timings", url: "index.html#spiritualGuide" }, { label: "Ashram Taxi & Station Pickups", url: "#" }],
    legal: [{ label: "Pilgrim Code of Conduct", url: "#" }, { label: "Privacy Terms", url: "#" }, { label: "Host an Ashram or Haveli", url: "roomo-signup.html" }]
  },
  testimonials: {
    eyebrow: "Heartfelt Devotee Words",
    title: "Words from Fellow Pilgrims",
    description: "Authentic experiences shared by devotees who sought blessed shelter through ROOMO.",
    ratingSummary: "4.9 / 5 (1,840+ Pilgrims)",
    items: [
      { id: "senthil", quote: "Our Pournami Girivalam stay was profoundly peaceful. The room was immaculate, 3 minutes from Sri Ramanasramam, and our host welcomed us with sacred vibhuti and temple prasadam.", name: "Senthil Ramanathan", location: "Chennai, Tamil Nadu", rating: 5, hidden: false },
      { id: "ananya", quote: "During Karthigai Deepam festival when everywhere else was charging inflated prices, ROOMO honored our confirmed heritage booking without surprise costs. Utterly safe for solo women travelers.", name: "Ananya Sharma", location: "Bengaluru, Karnataka", rating: 5, hidden: false },
      { id: "michael", quote: "The open terrace had an unobstructed view of Holy Mount Arunachala for morning dhyanam. The support care team coordinated our temple darshan passes smoothly.", name: "Michael Harrison", location: "San Francisco, USA", rating: 5, hidden: false },
      { id: "venkatesh", quote: "The sattvic breakfast and quiet courtyard ambiance made our family pilgrimage so memorable. Booking was effortless and check-in at midnight was greeted warmly.", name: "Venkatesh Krishnan", location: "Hyderabad, Telangana", rating: 5, hidden: false }
    ]
  }
};
module.exports = homepageDefaults;
