// Shared demo property data used by search results and stay details.
window.ROOMO_STAYS = [
{id:'arunachala-inn',name:'Hotel Arunachala Inn',type:'Ashrams & Retreats',location:'Near Sri Ramanasramam · approx. 250 m',rating:4.7,reviews:218,price:1499,distance:250,tag:'Guest favourite',img:'https://lh3.googleusercontent.com/aida-public/AB6AXuCjpc5VPAMnHiuVZYecSqsGXduU5_IYHeTf1gvafNWk_-2v4ZukH2uGS0UwNFg82hH2MBsBcdYqILpnRrCg78WVbhWST6XAult6PXFOIaKEKsZQ8i8giCIcI-rzHW9GT0XCqsuDdTvgKIRcV-742qVjUGGRxeiguUW6zze2ZI9eJ1KrKmqWUw5dTOsKapa3S7W49QFd3GbrZ8Xu31eXb-TR4lZJGNxQYCobfsajAOPmss-aYLHBe_sO',desc:'A calm retreat with a private balcony and views towards Arunachala.',amenities:['wifi','parking','ac','view','hotwater','private','quiet'],distances:['ramana','girivalam'],rooms:['private','quiet','family'],perks:['Quiet courtyard','Balcony with hill view','24-hour reception']},
{id:'siva-shakti',name:'Siva Shakti Residency',type:'Vedic Mathas & Inns',location:'Main Road · approx. 400 m to Annamalaiyar Temple',rating:4.5,reviews:164,price:999,distance:400,tag:'Great location',img:'https://lh3.googleusercontent.com/aida-public/AB6AXuDpVPQUgrreK3-w52kGqfySHt3p4P_o2eomIUFBsPbIiNzO7PGfY1nax8_hE7dHBI5XX_SzpXadxmUVPAg6glztmRM38ZSV0X2N2Fv75NKSsh2PEDnEt04fCiPjwl57BbtgggVhXg2VTCyT3OJvUBwCwet7mVe_uHxWrSTaSepeJa3ShWSGwhdEVZJZbUjtAwvSoLmbSVP1iFB1h22Q0KYCqIltZy2MxwETHUmSdpsvw0G8wFllTF9H',desc:'A convenient, welcoming base for early morning darshan and temple visits.',amenities:['wifi','parking','ac','hotwater','private'],distances:['temple'],rooms:['private','family','accessible'],perks:['Near main temple road','Family-friendly rooms','Free parking']},
{id:'annamalai-guesthouse',name:'Annamalai Guest House',type:'Vedic Mathas & Inns',location:'Near Central Bus Stand & Market',rating:4.3,reviews:96,price:799,distance:1200,tag:'Value stay',img:'https://lh3.googleusercontent.com/aida-public/AB6AXuBhbXOK_PdyukniK0zeTSMc68JxxLC5_9pxdDmm0GxlKxz9NHxuIY4qnupzjaG3Y9aqgWzNwdm_jd_f-CzxFdVYReFnpuOgQ0h_8M_Kn1pi0o88UilLiKYFlsOImdfJY3O3MYPjHX9_lYRAETY0XWnFy5EtwNNIoW0AKJf-caWykUtHB5MqbJarLBR3ROdzn2GtsV6MDF20gGbtbAHn5Id7LMNzEmesrj3vjKAwQ57cFX98lGDuD72L',desc:'Simple, peaceful rooms with easy transport access and hot water.',amenities:['wifi','parking','hotwater','private'],distances:['bus'],rooms:['private','family'],perks:['Budget-friendly','24-hour hot water','Transport access']},
{id:'ramana-heritage',name:'Ramana Heritage Stays',type:'Heritage Haveli Homes',location:'Girivalam Road · panoramic Arunachala hill view',rating:4.8,reviews:143,price:2199,distance:180,tag:'Top rated',img:'https://lh3.googleusercontent.com/aida-public/AB6AXuBJ3ru1MFLx8fXh0zDW7gWD7RMLKSGXvUrctcltCm9QVI5ua8pmjo5JOGy-l_zUNqLaOuink7ezYaZd-I8qpRTfzn_nkfn7WBZbjt2Vx6TcfmgEh1zTSqN65Co21DVQB6sGM-T2qqLI2D9kDqH8C2QqWevYBJc0KdO93q9cb68SZf4CHicPJJV440iIFp9YgAkGnIN8he_ZVH-uyXlSwJUPqwDbmqBj5t8_5Gz3zuBM40QmjpMqvRHs',desc:'A heritage-inspired stay beside the sacred circumambulation path.',amenities:['wifi','parking','ac','breakfast','view','hotwater','private','quiet'],distances:['girivalam','ramana'],rooms:['private','quiet','family'],perks:['Arunachala views','Breakfast included','Meditation terrace']},
{id:'temple-view-suites',name:'Arunachala Temple View Suites',type:'Temple View Suites',location:'Temple district · convenient darshan access',rating:4.6,reviews:87,price:1799,distance:350,tag:'Temple access',img:'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=900&q=80',desc:'Comfortable suites for devotees seeking a convenient temple-district stay.',amenities:['wifi','ac','breakfast','view','hotwater','private'],distances:['temple'],rooms:['private','family','accessible'],perks:['Temple district location','Breakfast included','Hill-facing rooms']},
{id:'agni-theertham-haveli',name:'Agni Theertham Haveli',type:'Heritage Haveli Homes',location:'Tiruvannamalai · peaceful heritage neighbourhood',rating:4.9,reviews:112,price:2499,distance:500,tag:'Heritage stay',img:'https://lh3.googleusercontent.com/aida-public/AB6AXuBXtxCnBzRiU8d5Qigy_OG6WAAzgDWLqUvqg20izQ2cqA7lgJOctKf2KLOe3knicN5-cDtuWa4hmVn-Tw8jrI3dmbFMzpu61c0fqk4x2xBvAk8AzLbPflWc5Ufu4Tnxvlp-FqLCVwySU_X6SuSobKQmr1KgIHHCpppWcWezUk6ZHoFf5RmdR3M1mtDHtLDbvcFtF2V8NxLt3nJiNCb9jGpKl2enX0uyzIYk30cFu4MX5tb4Y5OeOtGC',desc:'A heritage-inspired haveli with calm courtyard spaces for pilgrims to unwind between temple visits.',amenities:['wifi','parking','ac','breakfast','view','hotwater','private','quiet'],distances:['temple','girivalam'],rooms:['private','quiet','family'],perks:['Heritage courtyard','Quiet spaces','Convenient sacred-district access']}
];

// code.html: page interactions
if (document.body.classList.contains("home-page")) {
(function() {
// Karthigai Deepam 2026 Countdown Script
      function initDeepamCountdown() {
        const targetDate = new Date('2026-11-26T18:00:00+05:30').getTime();

        function updateTimer() {
          const now = new Date().getTime();
          const diff = targetDate - now;
          if (diff <= 0) {
            if (document.getElementById('cdDays')) document.getElementById('cdDays').innerText = '00';
            if (document.getElementById('cdHours')) document.getElementById('cdHours').innerText = '00';
            if (document.getElementById('cdMins')) document.getElementById('cdMins').innerText = '00';
            if (document.getElementById('cdSecs')) document.getElementById('cdSecs').innerText = '00';
            return;
          }
          const days = Math.floor(diff / (1000 * 60 * 60 * 24));
          const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
          const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          const secs = Math.floor((diff % (1000 * 60)) / 1000);
          const pad = n => String(n).padStart(2, '0');
          if (document.getElementById('cdDays')) document.getElementById('cdDays').innerText = String(days);
          if (document.getElementById('cdHours')) document.getElementById('cdHours').innerText = pad(hours);
          if (document.getElementById('cdMins')) document.getElementById('cdMins').innerText = pad(mins);
          if (document.getElementById('cdSecs')) document.getElementById('cdSecs').innerText = pad(secs);
        }
        updateTimer();
        setInterval(updateTimer, 1000);
      }
      document.addEventListener('DOMContentLoaded', initDeepamCountdown);
if (typeof initDeepamCountdown === "function") window.initDeepamCountdown = initDeepamCountdown;
if (typeof updateTimer === "function") window.updateTimer = updateTimer;
if (typeof openLightboxByIndex === "function") window.openLightboxByIndex = openLightboxByIndex;
if (typeof stepGalleryImage === "function") window.stepGalleryImage = stepGalleryImage;
if (typeof renderLightbox === "function") window.renderLightbox = renderLightbox;
})();
}

// code.html: page interactions
if (document.body.classList.contains("home-page")) {
(function() {
// 1. Initialise manual dates
      document.addEventListener('DOMContentLoaded', () => {
        const today = new Date();
        const dIn = new Date(today);
        dIn.setDate(today.getDate() + 3);
        const dOut = new Date(today);
        dOut.setDate(today.getDate() + 4);
        const fmt = d => d.toISOString().split('T')[0];
        const cin = document.getElementById('checkinPicker');
        const cout = document.getElementById('checkoutPicker');
        cin.min = fmt(today);
        cout.min = fmt(today);
        cin.value = fmt(dIn);
        cout.value = fmt(dOut);
        initDropdownInteractivity();
        updateStepperButtons();
      });

      function onDateChanged() {
        const cin = document.getElementById('checkinPicker');
        const cout = document.getElementById('checkoutPicker');
        if (cin.value) {
          cout.min = cin.value;
          if (cout.value && cout.value <= cin.value) {
            const nextDay = new Date(cin.value);
            nextDay.setDate(nextDay.getDate() + 1);
            cout.value = nextDay.toISOString().split('T')[0];
          }
        }
      }
      // 2. Guests & Rooms State with strict constraints
      const devoteeState = {
        adults: 2, // min 1, max 8
        children: 0, // min 0, max 6
        rooms: 1 // min 1, max 5
      };
      const constraints = {
        adults: {
          min: 1,
          max: 8
        },
        children: {
          min: 0,
          max: 6
        },
        rooms: {
          min: 1,
          max: 5
        }
      };

      function updateCount(type, delta) {
        const min = constraints[type].min;
        const max = constraints[type].max;
        const newVal = devoteeState[type] + delta;
        if (newVal >= min && newVal <= max) {
          devoteeState[type] = newVal;
          if (type === 'adults') document.getElementById('adultVal').innerText = newVal;
          if (type === 'children') document.getElementById('childrenVal').innerText = newVal;
          if (type === 'rooms') document.getElementById('roomVal').innerText = newVal;
          updateGuestsLabel();
          updateStepperButtons();
        }
      }

      function updateStepperButtons() {
        document.getElementById('adultsMinus').disabled = devoteeState.adults <= constraints.adults.min;
        document.getElementById('adultsPlus').disabled = devoteeState.adults >= constraints.adults.max;
        document.getElementById('childrenMinus').disabled = devoteeState.children <= constraints.children.min;
        document.getElementById('childrenPlus').disabled = devoteeState.children >= constraints.children.max;
        document.getElementById('roomsMinus').disabled = devoteeState.rooms <= constraints.rooms.min;
        document.getElementById('roomsPlus').disabled = devoteeState.rooms >= constraints.rooms.max;
      }

      function updateGuestsLabel() {
        const adultTxt = `${devoteeState.adults} Adult${devoteeState.adults > 1 ? 's' : ''}`;
        const childTxt = `${devoteeState.children} Child${devoteeState.children === 1 ? '' : 'ren'}`;
        const roomTxt = `${devoteeState.rooms} Room${devoteeState.rooms > 1 ? 's' : ''}`;
        document.getElementById('guestsLabel').innerText = `${adultTxt} · ${childTxt} · ${roomTxt}`;
      }

      function initDropdownInteractivity() {
        const trigger = document.getElementById('devoteeTrigger');
        const panel = document.getElementById('devoteePanel');
        const container = document.getElementById('devoteeDropdownContainer');
        const form = document.getElementById('staySearchForm');
        if (trigger && panel && container && !trigger.dataset.dropdownReady) {
          trigger.dataset.dropdownReady = 'true';
          const setOpen = (open) => {
            panel.classList.toggle('show', open);
            trigger.setAttribute('aria-expanded', String(open));
            const chevron = document.getElementById('devoteeChevron');
            if (chevron) chevron.style.transform = open ? 'rotate(180deg)' : '';
          };
          trigger.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            setOpen(!panel.classList.contains('show'));
          });
          trigger.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setOpen(!panel.classList.contains('show'));
            } else if (e.key === 'Escape') {
              setOpen(false);
            }
          });
          panel.addEventListener('click', (e) => e.stopPropagation());
          document.addEventListener('click', (e) => {
            if (!container.contains(e.target)) setOpen(false);
          });
        }
        if (form && !form.dataset.searchReady) {
          form.dataset.searchReady = 'true';
          form.addEventListener('submit', (e) => {
            e.preventDefault();
            doSearch();
          });
        }
      }

      function closeDevoteeDropdown() {
        const panel = document.getElementById('devoteePanel');
        const trigger = document.getElementById('devoteeTrigger');
        if (panel) panel.classList.remove('show');
        if (trigger) {
          trigger.setAttribute('aria-expanded', 'false');
          const chevron = document.getElementById('devoteeChevron');
          if (chevron) chevron.style.transform = '';
        }
      }

      function switchCategory(btn) {
        document.querySelectorAll('.stay-category-pill-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      }
      // 3. Stays Carousel Scroll
      function scrollCarousel(dir) {
        const track = document.getElementById('stayTrack');
        track.scrollBy({
          left: dir * 320,
          behavior: 'smooth'
        });
      }
      // 4. Testimonials Carousel Scroll
      function scrollTestimonials(dir) {
        const track = document.getElementById('testimonialTrack');
        track.scrollBy({
          left: dir * 360,
          behavior: 'smooth'
        });
      }

      function toggleWish(btn) {
        btn.classList.toggle('active');
        const icon = btn.querySelector('i');
        icon.classList.toggle('bi-heart');
        icon.classList.toggle('bi-heart-fill');
      }
      // 5. Stay Details Modal Data
      const staysData = {
        'arunachala-inn': {
          name: 'Hotel Arunachala Inn',
          location: 'Near Ramanashram (250m walking distance)',
          rating: '4.7 ★',
          price: '₹1,499',
          img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCjpc5VPAMnHiuVZYecSqsGXduU5_IYHeTf1gvafNWk_-2v4ZukH2uGS0UwNFg82hH2MBsBcdYqILpnRrCg78WVbhWST6XAult6PXFOIaKEKsZQ8i8giCIcI-rzHW9GT0XCqsuDdTvgKIRcV-742qVjUGGRxeiguUW6zze2ZI9eJ1KrKmqWUw5dTOsKapa3S7W49QFd3GbrZ8Xu31eXb-TR4lZJGNxQYCobfsajAOPmss-aYLHBe_sO',
          proximity: 'Situated 3 minutes walking from Sri Ramanasramam main entrance and starting point of Girivalam path. Private balcony overlooking Arunachala mountain.'
        },
        'siva-shakti': {
          name: 'Siva Shakti Residency',
          location: 'Main Road, 400m to Annamalaiyar Raja Gopuram',
          rating: '4.5 ★',
          price: '₹999',
          img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDpVPQUgrreK3-w52kGqfySHt3p4P_o2eomIUFBsPbIiNzO7PGfY1nax8_hE7dHBI5XX_SzpXadxmUVPAg6glztmRM38ZSV0X2N2Fv75NKSsh2PEDnEt04fCiPjwl57BbtgggVhXg2VTCyT3OJvUBwCwet7mVe_uHxWrSTaSepeJa3ShWSGwhdEVZJZbUjtAwvSoLmbSVP1iFB1h22Q0KYCqIltZy2MxwETHUmSdpsvw0G8wFllTF9H',
          proximity: 'Located on Main Road close to Eastern Rajagopuram entrance. Highly convenient for early morning temple darshan and puja participation.'
        },
        'annamalai-guesthouse': {
          name: 'Annamalai Guest House',
          location: 'Near Central Bus Stand & Market',
          rating: '4.3 ★',
          price: '₹799',
          img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBhbXOK_PdyukniK0zeTSMc68JxxLC5_9pxdDmm0GxlKxz9NHxuIY4qnupzjaG3Y9aqgWzNwdm_jd_f-CzxFdVYReFnpuOgQ0h_8M_Kn1pi0o88UilLiKYFlsOImdfJY3O3MYPjHX9_lYRAETY0XWnFy5EtwNNIoW0AKJf-caWykUtHB5MqbJarLBR3ROdzn2GtsV6MDF20gGbtbAHn5Id7LMNzEmesrj3vjKAwQ57cFX98lGDuD72L',
          proximity: 'Walking distance to Government Bus Stand. Peaceful rooms with 24-hr hot water and direct transport accessibility.'
        },
        'ramana-heritage': {
          name: 'Ramana Heritage Stays',
          location: 'Girivalam Road (Unobstructed Hill View)',
          rating: '4.8 ★',
          price: '₹2,199',
          img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBJ3ru1MFLx8fXh0zDW7gWD7RMLKSGXvUrctcltCm9QVI5ua8pmjo5JOGy-l_zUNqLaOuink7ezYaZd-I8qpRTfzn_nkfn7WBZbjt2Vx6TcfmgEh1zTSqN65Co21DVQB6sGM-T2qqLI2D9kDqH8C2QqWevYBJc0KdO93q9cb68SZf4CHicPJJV440iIFp9YgAkGnIN8he_ZVH-uyXlSwJUPqwDbmqBj5t8_5Gz3zuBM40QmjpMqvRHs',
          proximity: 'Located right on the holy Girivalam pathway with open-air terrace meditation deck and unobstructed panoramic view of Mount Arunachala.'
        }
      };

      function showStayDetails(stayId) {
        const params = new URLSearchParams();
        params.set('stay', stayId);
        const checkin = document.getElementById('checkinPicker')?.value || '';
        const checkout = document.getElementById('checkoutPicker')?.value || '';
        if (checkin) params.set('checkin', checkin);
        if (checkout) params.set('checkout', checkout);
        if (typeof devoteeState !== 'undefined') {
          params.set('adults', String(devoteeState.adults || 2));
          params.set('children', String(devoteeState.children || 0));
          params.set('rooms', String(devoteeState.rooms || 1));
        }
        window.location.href = 'roomo-stay-details.html?' + params.toString();
      }

      function bookRoomAlert() {
        const name = document.getElementById('detailName').innerText;
        const cin = document.getElementById('checkinPicker').value;
        const cout = document.getElementById('checkoutPicker').value;
        alert(`Om Arunachaleshwaraya Namaha! Sanctuary at ${name} for ${cin} to ${cout} (${devoteeState.adults} adults, ${devoteeState.children} children, ${devoteeState.rooms} rooms) has been successfully requested. Blessings & confirmation sent to your mobile.`);
        const modalEl = document.getElementById('propertyDetailsModal');
        const modal = bootstrap.Modal.getInstance(modalEl);
        if (modal) modal.hide();
      }
      function doSearch() {
        const dest = document.getElementById('destinationInput').value.trim() || 'Tiruvannamalai';
        const cin = document.getElementById('checkinPicker').value;
        const cout = document.getElementById('checkoutPicker').value;
        const activeCategory = document.querySelector('.stay-category-pill-btn.active');
        const params = new URLSearchParams({ destination: dest, checkin: cin, checkout: cout,
          adults: String(devoteeState.adults), children: String(devoteeState.children),
          rooms: String(devoteeState.rooms), category: activeCategory ? activeCategory.innerText.trim().replace(/\s+/g, ' ') : 'All stays' });
        window.location.href = 'roomo-search-results.html?' + params.toString();
      }
if (typeof onDateChanged === "function") window.onDateChanged = onDateChanged;
if (typeof updateCount === "function") window.updateCount = updateCount;
if (typeof updateStepperButtons === "function") window.updateStepperButtons = updateStepperButtons;
if (typeof updateGuestsLabel === "function") window.updateGuestsLabel = updateGuestsLabel;
if (typeof initDropdownInteractivity === "function") window.initDropdownInteractivity = initDropdownInteractivity;
if (typeof closeDevoteeDropdown === "function") window.closeDevoteeDropdown = closeDevoteeDropdown;
if (typeof switchCategory === "function") window.switchCategory = switchCategory;
if (typeof scrollCarousel === "function") window.scrollCarousel = scrollCarousel;
if (typeof scrollTestimonials === "function") window.scrollTestimonials = scrollTestimonials;
if (typeof toggleWish === "function") window.toggleWish = toggleWish;
if (typeof showStayDetails === "function") window.showStayDetails = showStayDetails;
if (typeof bookRoomAlert === "function") window.bookRoomAlert = bookRoomAlert;
if (typeof filterGallery === "function") window.filterGallery = filterGallery;
if (typeof viewPhoto === "function") window.viewPhoto = viewPhoto;
if (typeof doSearch === "function") window.doSearch = doSearch;
})();
}

// roomo-search-results.html: page interactions
if (document.body.classList.contains("search-page")) {
(function() {
const stays = window.ROOMO_STAYS;
const p=new URLSearchParams(location.search),dest=p.get('destination')||'Tiruvannamalai',cin=p.get('checkin')||'',cout=p.get('checkout')||'',adults=p.get('adults')||'2',children=p.get('children')||'0',rooms=p.get('rooms')||'1';document.getElementById('destination').textContent=dest;document.getElementById('dates').textContent=cin&&cout?fmt(cin)+' – '+fmt(cout):'Choose your dates';document.getElementById('guests').textContent=`${adults} adult${+adults===1?'':'s'} · ${children} children · ${rooms} room${+rooms===1?'':'s'}`;document.getElementById('category').textContent=p.get('category')||'All stays';function fmt(v){return new Date(v+'T12:00:00').toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}function checked(n){return [...document.querySelectorAll(`[name="${n}"]:checked`)].map(x=>x.value)}function filterCount(){return ['type','rating','amenity','distance','room'].reduce((n,k)=>n+checked(k).length,0)}
function filtered(){let min=Math.max(0,+document.getElementById('minPrice').value||0),max=Math.max(min,+document.getElementById('maxPrice').value||5000),types=checked('type'),ratings=checked('rating'),amenities=checked('amenity'),distances=checked('distance'),roomsPref=checked('room');let a=stays.filter(s=>s.price>=min&&s.price<=max);if(types.length)a=a.filter(s=>types.includes(s.type));if(ratings.length)a=a.filter(s=>ratings.some(r=>s.rating>=+r));if(amenities.length)a=a.filter(s=>amenities.every(x=>s.amenities.includes(x)));if(distances.length)a=a.filter(s=>distances.some(x=>s.distances.includes(x)));if(roomsPref.length)a=a.filter(s=>roomsPref.every(x=>s.rooms.includes(x)));let q=document.querySelector('.quick button.active')?.dataset.quick||'all';if(q==='budget')a=a.filter(s=>s.price<1500);if(q==='rating')a=a.filter(s=>s.rating>=4.5);if(q==='view')a=a.filter(s=>s.amenities.includes('view'));if(q==='breakfast')a=a.filter(s=>s.amenities.includes('breakfast'));let sort=document.getElementById('sort').value;if(sort==='low')a.sort((x,y)=>x.price-y.price);if(sort==='high')a.sort((x,y)=>y.price-x.price);if(sort==='rating')a.sort((x,y)=>y.rating-x.rating);if(sort==='distance')a.sort((x,y)=>x.distance-y.distance);return a}
function render(){let a=filtered(),el=document.getElementById('listings');document.getElementById('resultCount').textContent=`Showing ${a.length} blessed stay${a.length===1?'':'s'}${filterCount()?' · filters applied':''}`;document.getElementById('filterCount').textContent=filterCount()?`(${filterCount()})`:'';if(!a.length){el.innerHTML='<div class="empty"><i class="bi bi-search-heart"></i><h3>No stays match these filters</h3><p>Try widening your price range or removing a filter.</p><button onclick="clearAll()">Clear all filters</button></div>';return}el.innerHTML=a.map(s=>`<article class="listing listing-clickable" tabindex="0" role="link" aria-label="View details for ${s.name}" onclick="if(!event.target.closest('button'))viewStay('${s.id}')" onkeydown="if(event.key==='Enter'&&!event.target.closest('button'))viewStay('${s.id}')"><div class="photo"><img src="${s.img}" alt="${s.name}" loading="lazy"><span class="tag"><i class="bi bi-patch-check-fill"></i> ${s.tag}</span><button class="heart" aria-label="Save stay" onclick="this.classList.toggle('active');this.innerHTML=this.classList.contains('active')?'<i class=\'bi bi-heart-fill\'></i>':'<i class=\'bi bi-heart\'></i>'"><i class="bi bi-heart"></i></button></div><div class="main"><div class="type">${s.type}</div><h3>${s.name}</h3><div class="location"><i class="bi bi-geo-alt"></i> ${s.location}</div>${s.reviews>0?`<div class="rating-line"><span class="rating">${s.rating.toFixed(1)} <i class="bi bi-star-fill"></i></span><span><strong>${s.rating>=4.7?'Exceptional':s.rating>=4.5?'Excellent':'Very good'}</strong> · ${s.reviews} guest reviews</span></div>`:'<div class="rating-line"><span class="rating-new">New listing</span><span>Be among the first to stay</span></div>'}<div class="desc">${s.desc}</div><div class="features">${s.amenities.includes('wifi')?'<span class="feature"><i class="bi bi-wifi"></i> Free Wi-Fi</span>':''}${s.amenities.includes('ac')?'<span class="feature"><i class="bi bi-snow"></i> Air conditioning</span>':''}${s.amenities.includes('parking')?'<span class="feature"><i class="bi bi-p-circle"></i> Parking</span>':''}${s.amenities.includes('breakfast')?'<span class="feature"><i class="bi bi-cup-hot"></i> Breakfast</span>':''}${s.amenities.includes('view')?'<span class="feature"><i class="bi bi-mountain"></i> Sacred views</span>':''}</div><div class="perks">${s.perks.slice(0,2).map(x=>`<span><i class="bi bi-check-circle-fill"></i> ${x}</span>`).join('')}</div></div><div class="side"><div class="available"><i class="bi bi-check-circle-fill"></i> Check availability</div><div class="price-box"><div class="price-note">Starting from</div><div class="price">₹${s.price.toLocaleString('en-IN')} <small>/ night</small></div><div class="tax">Taxes may apply</div></div><button class="details" onclick="viewStay('${s.id}')">View rooms <i class="bi bi-arrow-right"></i></button></div></article>`).join('')}
function viewStay(id){const params=new URLSearchParams(location.search);params.set('stay',id);location.href='roomo-stay-details.html?'+params.toString()}function clearAll(){document.querySelectorAll('#filters input[type=checkbox]').forEach(x=>x.checked=false);document.getElementById('minPrice').value=500;document.getElementById('maxPrice').value=5000;document.getElementById('maxRange').value=5000;document.querySelectorAll('.quick button').forEach(b=>b.classList.toggle('active',b.dataset.quick==='all'));document.getElementById('sort').value='recommended';syncPrice();render()}function syncPrice(){document.getElementById('minLabel').textContent=(+document.getElementById('minPrice').value||0).toLocaleString('en-IN');document.getElementById('maxLabel').textContent=(+document.getElementById('maxPrice').value||5000).toLocaleString('en-IN')}document.getElementById('maxRange').addEventListener('input',e=>{document.getElementById('maxPrice').value=e.target.value;syncPrice();render()});document.getElementById('maxPrice').addEventListener('change',e=>{document.getElementById('maxRange').value=Math.min(5000,Math.max(500,+e.target.value||5000));syncPrice();render()});document.getElementById('minPrice').addEventListener('change',()=>{syncPrice();render()});document.querySelectorAll('#filters input[type=checkbox]').forEach(x=>x.addEventListener('change',render));document.getElementById('sort').addEventListener('change',render);document.querySelectorAll('.quick button').forEach(b=>b.addEventListener('click',()=>{document.querySelectorAll('.quick button').forEach(x=>x.classList.remove('active'));b.classList.add('active');render()}));document.getElementById('clear').addEventListener('click',clearAll);document.getElementById('apply').addEventListener('click',()=>document.getElementById('filters').classList.remove('mobile-open'));document.getElementById('mobileFilter').addEventListener('click',()=>document.getElementById('filters').classList.toggle('mobile-open'));syncPrice();render();
(async function loadPublishedProperties() {
  try {
    const response = await fetch("http://localhost:5001/api/properties?limit=50", { cache: "no-store" });
    if (!response.ok) return;
    const payload = await response.json();
    const properties = Array.isArray(payload.properties) ? payload.properties : [];
    if (!properties.length) return;
    const liveStays = properties.map(property => {
      const amenities = Array.isArray(property.amenities) ? property.amenities : [];
      const images = Array.isArray(property.images) ? property.images.map(image => image.imageUrl).filter(Boolean) : [];
      return {
        id: property.id,
        name: property.title,
        type: property.propertyType || "Sanctuary stay",
        location: [property.address, property.city, property.state].filter(Boolean).join(", "),
        rating: Number(property.rating || 0),
        reviews: Number(property.reviews || 0),
        price: Number(property.nightlyPrice || 0),
        img: images[0] || "https://placehold.co/800x600/eaf1f8/45617c?text=ROOMO+Sacred+Stay",
        images,
        desc: property.description || "",
        amenities,
        nearbyLandmarks: Array.isArray(property.nearbyLandmarks) ? property.nearbyLandmarks : [],
        perks: Array.isArray(property.perks) ? property.perks : [],
        tag: "Published stay",
        distances: [],
        rooms: [],
        distance: Number.MAX_SAFE_INTEGER,
        maxGuests: Number(property.maxGuests || 1),
        bedrooms: Number(property.bedrooms || 1),
        bathrooms: Number(property.bathrooms || 1)
      };
    });
    // Prefer real published inventory over static sample cards when available.
    stays.splice(0, stays.length, ...liveStays);
    render();
  } catch (error) {
    console.info("ROOMO: Published listings are unavailable; showing sample listings.", error);
  }
})();
if (typeof fmt === "function") window.fmt = fmt;
if (typeof checked === "function") window.checked = checked;
if (typeof filterCount === "function") window.filterCount = filterCount;
if (typeof filtered === "function") window.filtered = filtered;
if (typeof render === "function") window.render = render;
if (typeof viewStay === "function") window.viewStay = viewStay;
if (typeof clearAll === "function") window.clearAll = clearAll;
if (typeof syncPrice === "function") window.syncPrice = syncPrice;
})();
}


// roomo-stay-details.html: render selected property details from shared demo data
if (document.body.classList.contains("stay-details-page")) {
  (async () => {
  const params = new URLSearchParams(location.search);
  let stay = (window.ROOMO_STAYS || []).find(item => item.id === params.get("stay")) || (window.ROOMO_STAYS || [])[0];
  try {
    const response = await fetch("http://localhost:5001/api/homepage", { cache: "no-store" });
    if (response.ok) {
      const payload = await response.json();
      const content = payload.content || {};
      const selectedId = params.get("stay");
      let property = (content.featuredProperties || []).find(item => item.id === selectedId);
      if (!property && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(selectedId || ""))) {
        try {
          const detailResponse = await fetch("http://localhost:5001/api/properties/" + encodeURIComponent(selectedId), { cache: "no-store" });
          if (detailResponse.ok) {
            const detailPayload = await detailResponse.json();
            property = detailPayload.property || null;
          }
        } catch (detailError) {
          console.warn("Could not load published property details.", detailError);
        }
      }
      const legacyRoom = (content.featuredRooms || []).find(item => item.id === selectedId);
      const room = property ? {
        id: property.id,
        name: property.title,
        type: property.propertyType || "Sanctuary stay",
        location: [property.address, property.city, property.state].filter(Boolean).join(", "),
        rating: Number(property.rating || 0),
        reviews: Number(property.reviews || 0),
        price: Number(property.nightlyPrice || 0),
        img: property.images?.[0]?.imageUrl || "",
        images: (property.images || []).map(image => image.imageUrl).filter(Boolean),
        desc: property.description || "",
        amenities: Array.isArray(property.amenities) ? property.amenities : [],
        nearbyLandmarks: Array.isArray(property.nearbyLandmarks) ? property.nearbyLandmarks : [],
        perks: Array.isArray(property.perks) ? property.perks : []
      } : legacyRoom;
      if (room) {
        stay = {
          ...(stay || {}),
          id: room.id, name: room.name, type: room.type || "Sanctuary stay",
          location: room.location, rating: Number(room.rating || 0), reviews: Number(room.reviews || 0),
          price: Number(room.price || 0), img: room.img, images: room.images || (stay && stay.images) || [], desc: room.desc,
          amenities: Array.isArray(room.amenities) ? room.amenities : ((stay && stay.amenities) || []),
          nearbyLandmarks: Array.isArray(room.nearbyLandmarks) ? room.nearbyLandmarks : [],
          perks: Array.isArray(room.perks) ? room.perks : ((stay && stay.perks) || [])
        };
      }
    }
  } catch (error) { console.warn("Could not load the latest featured stay details.", error); }
  const root = document.getElementById("stayDetails");
  if (stay && root) {
    const amenityLabels = {wifi:"Free Wi-Fi",parking:"Free parking",ac:"Air conditioning",breakfast:"Breakfast included",view:"Arunachala / sacred views",hotwater:"24-hour hot water",private:"Private bathroom",quiet:"Quiet / meditation space",family:"Family-friendly options",accessible:"Accessibility features"};
    const amenities = (stay.amenities || []).map(key => `<span class="detail-amenity"><i class="bi bi-check-circle-fill"></i>${amenityLabels[key] || key}</span>`).join("");
    const landmarkLabels = {"annamalaiyar-temple":"Arunachaleswarar / Annamalaiyar Temple","sri-ramanasramam":"Sri Ramanasramam","girivalam-path":"Girivalam path","arunachala-hill":"Arunachala Hill","skandashramam":"Skandashramam","virupaksha-cave":"Virupaksha Cave","sathanur-dam":"Sathanur Dam","central-bus-stand":"Central Bus Stand","railway-station":"Tiruvannamalai Railway Station","yogi-ram-surathkumar-ashram":"Yogi Ramsuratkumar Ashram"};
    const landmarks = (stay.nearbyLandmarks || []).map(key => `<div><i class="bi bi-geo-alt"></i><span><strong>${landmarkLabels[key] || key}</strong><small>Nearby landmark selected for this property</small></span></div>`).join("");
    const dateValue = (offset) => { const date = new Date(); date.setHours(12, 0, 0, 0); date.setDate(date.getDate() + offset); return date.toISOString().slice(0, 10); };
    const today = dateValue(0);
    const checkin = params.get("checkin") || dateValue(3);
    const checkout = params.get("checkout") || dateValue(4);
    const adults = Math.min(16, Math.max(1, Number(params.get("adults") || 2)));
    const children = Math.min(10, Math.max(0, Number(params.get("children") || 0)));
    const rooms = Math.min(8, Math.max(1, Number(params.get("rooms") || 1)));
    root.innerHTML = `<div class="detail-crumb"><a href="code.html">Home</a><i class="bi bi-chevron-right"></i><a href="roomo-search-results.html${location.search}">Blessed Stays</a><i class="bi bi-chevron-right"></i><span>${stay.name}</span></div>
      <section class="detail-hero"><div><span class="detail-eyebrow"><i class="bi bi-patch-check-fill"></i> ROOMO Sacred · Curated stay</span><h1>${stay.name}</h1><p><i class="bi bi-geo-alt-fill"></i> ${stay.location}</p><div class="detail-rating"><span>${stay.rating.toFixed(1)} <i class="bi bi-star-fill"></i></span> ${stay.reviews} guest reviews · ${stay.type}</div></div><button class="detail-outline" onclick="history.back()"><i class="bi bi-arrow-left"></i> Back to results</button></section>
      <div class="detail-gallery"><div class="detail-gallery-main">${((stay.images || []).filter(Boolean)[0]) ? '<img id="detailMainImage" src="' + String((stay.images || []).filter(Boolean)[0]).replace(/&/g, "&amp;").replace(/"/g, "&quot;") + '" alt="' + stay.name + ' accommodation" />' : '<div class="detail-gallery-empty">No property photos have been added yet.</div>'}</div><div class="detail-gallery-side">${((stay.images || []).filter(Boolean).slice(1,5).map((image,index)=>'<button class="detail-gallery-thumb" type="button" data-gallery-image="'+String(image).replace(/&/g,'&amp;').replace(/"/g,'&quot;')+'" aria-label="View property photo '+(index+2)+'"><img src="'+String(image).replace(/&/g,'&amp;').replace(/"/g,'&quot;')+'" alt="'+stay.name+' photo '+(index+2)+'" /></button>').join(''))}<div class="detail-gallery-note"><i class="bi bi-camera"></i><span>Property photos</span><small>${(stay.images || []).filter(Boolean).length} photo(s)</small></div></div></div>
      <div class="detail-columns"><div class="detail-content"><section class="detail-section"><span class="detail-eyebrow">WELCOME TO YOUR SANCTUARY</span><h2>About this stay</h2><p>${stay.desc} Enjoy a thoughtfully located base for your Tiruvannamalai visit, with easy access to sacred landmarks and time to rest between your spiritual explorations.</p><div class="detail-highlights">${stay.perks.map(perk=>`<span><i class="bi bi-check2-circle"></i>${perk}</span>`).join("")}</div></section>
      <section class="detail-section"><span class="detail-eyebrow">COMFORTS & CONVENIENCES</span><h2>Amenities</h2><div class="detail-amenities">${amenities}</div></section>
      <section class="detail-section"><span class="detail-eyebrow">PLAN YOUR VISIT</span><h2>Location & nearby landmarks</h2><p class="detail-location"><i class="bi bi-geo-alt-fill"></i>${stay.location}</p><div class="landmark-list">${landmarks || '<p class="detail-muted">Nearby landmarks have not been specified for this property.</p>'}</div></section>
      <section class="detail-section"><span class="detail-eyebrow">GUEST FEEDBACK</span><h2>Guest rating</h2><div class="review-summary"><strong>${stay.rating.toFixed(1)} <i class="bi bi-star-fill"></i></strong><div><b>${stay.rating>=4.7?'Exceptional':stay.rating>=4.5?'Excellent':'Very good'}</b><small>Based on ${stay.reviews} sample guest reviews</small></div></div><p class="detail-muted">Ratings and review counts are demo content for this prototype and are not live review data.</p></section></div>
      <aside class="detail-booking"><div class="booking-label"><i class="bi bi-house-heart"></i> Your sacred stay</div><div class="detail-price">₹${stay.price.toLocaleString('en-IN')} <small>/ night</small></div><p class="detail-muted">Starting price · taxes may apply</p><div class="booking-form"><label>Check-in<input id="detailCheckin" type="date" min="${today}" value="${checkin}" required /></label><label>Check-out<input id="detailCheckout" type="date" min="${checkin}" value="${checkout}" required /></label><label>Adults<select id="detailAdults">${Array.from({length:16},(_,i)=>i+1).map(n=>'<option value="' + n + '"' + (n===adults ? ' selected' : '') + '>' + n + ' adult' + (n===1 ? '' : 's') + '</option>').join("")}</select></label><label>Children<select id="detailChildren">${Array.from({length:11},(_,i)=>i).map(n=>'<option value="' + n + '"' + (n===children ? ' selected' : '') + '>' + n + ' ' + (n===1 ? 'child' : 'children') + '</option>').join("")}</select></label><label class="booking-room-field">Rooms<select id="detailRooms">${Array.from({length:8},(_,i)=>i+1).map(n=>'<option value="' + n + '"' + (n===rooms ? ' selected' : '') + '>' + n + ' room' + (n===1 ? '' : 's') + '</option>').join("")}</select></label></div><button class="detail-book-btn" id="checkAvailability"><i class="bi bi-search"></i> Check availability</button><p class="booking-note"><i class="bi bi-shield-check"></i> No payment is taken at this stage.</p><div id="availabilityMessage" class="availability-message" aria-live="polite"></div></aside></div><section id="availabilityResults" class="availability-results" hidden aria-live="polite"></section>`;
    root.querySelectorAll("[data-gallery-image]").forEach(button => button.addEventListener("click", () => { const main = document.getElementById("detailMainImage"); if (main) main.src = button.dataset.galleryImage; }));
    const checkinInput = document.getElementById("detailCheckin");
    const checkoutInput = document.getElementById("detailCheckout");
    const availabilityMessage = document.getElementById("availabilityMessage");
    const availabilityResults = document.getElementById("availabilityResults");
    const updateCheckoutMinimum = () => {
      checkoutInput.min = checkinInput.value || today;
      if (checkoutInput.value && checkinInput.value && checkoutInput.value <= checkinInput.value) {
        const next = new Date(checkinInput.value + "T12:00:00");
        next.setDate(next.getDate() + 1);
        checkoutInput.value = next.toISOString().slice(0, 10);
      }
    };
    checkinInput.addEventListener("change", updateCheckoutMinimum);
    async function runAvailabilitySearch() {
      const arrival = checkinInput.value;
      const departure = checkoutInput.value;
      const guestAdults = Number(document.getElementById("detailAdults").value);
      const guestChildren = Number(document.getElementById("detailChildren").value);
      const roomCount = Number(document.getElementById("detailRooms").value);
      availabilityMessage.classList.remove("is-error");
      availabilityResults.hidden = true;
      if (!arrival || !departure) {
        availabilityMessage.textContent = "Choose both your check-in and check-out dates to continue.";
        availabilityMessage.classList.add("is-error");
        return;
      }
      if (arrival < today) {
        availabilityMessage.textContent = "Check-in cannot be in the past.";
        availabilityMessage.classList.add("is-error");
        return;
      }
      if (departure <= arrival) {
        availabilityMessage.textContent = "Check-out must be at least one day after check-in.";
        availabilityMessage.classList.add("is-error");
        return;
      }
      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(stay.id))) {
        availabilityMessage.textContent = "Live availability is available for published properties. This sample stay does not have a live property record yet.";
        availabilityMessage.classList.add("is-error");
        return;
      }
      const query = new URLSearchParams(location.search);
      query.set("stay", stay.id);
      query.set("checkin", arrival);
      query.set("checkout", departure);
      query.set("adults", String(guestAdults));
      query.set("children", String(guestChildren));
      query.set("rooms", String(roomCount));
      history.replaceState(null, "", location.pathname + "?" + query.toString());
      const button = document.getElementById("checkAvailability");
      button.disabled = true;
      button.innerHTML = '<span class="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>Checking…';
      availabilityMessage.textContent = "Checking the property's reservation calendar…";
      try {
        const params = new URLSearchParams({ propertyId: stay.id, checkIn: arrival, checkOut: departure, adults: String(guestAdults), children: String(guestChildren), rooms: String(roomCount) });
        const response = await fetch("http://localhost:5001/api/reservations/availability?" + params.toString(), { cache: "no-store" });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.message || "Unable to check availability right now.");
        const money = value => "₹" + Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 });
        const available = Boolean(data.available);
        availabilityMessage.textContent = available ? "Availability checked successfully." : "There are not enough units available for those dates.";
        availabilityResults.innerHTML = '<div class="availability-results-head"><div><span class="detail-eyebrow">YOUR SEARCH</span><h2>Availability for your stay</h2><p>' + arrival + ' → ' + departure + ' · ' + data.nights + ' night' + (data.nights === 1 ? '' : 's') + ' · ' + guestAdults + ' adult' + (guestAdults === 1 ? '' : 's') + ' · ' + guestChildren + ' children · ' + roomCount + ' room' + (roomCount === 1 ? '' : 's') + '</p></div><span class="availability-search-check ' + (available ? '' : 'is-unavailable') + '"><i class="bi ' + (available ? 'bi-check-circle-fill' : 'bi-x-circle-fill') + '"></i> ' + (available ? 'Available' : 'Unavailable') + '</span></div><article class="availability-option"><div class="availability-option-icon"><i class="bi bi-house-door"></i></div><div class="availability-option-copy"><h3>' + data.property.title + '</h3><p>' + data.property.city + ' · ' + data.availableUnits + ' unit(s) currently available</p><small>' + (available ? 'Your selected dates fit the current reservation inventory.' : 'Try fewer rooms or different dates.') + '</small></div><div class="availability-option-price"><strong>' + money(data.totalAmount) + '</strong><span>estimated total</span><small>' + money(data.nightlyPrice) + ' × ' + data.nights + ' night(s) × ' + roomCount + ' room(s)</small></div></article>' + (available ? '<div class="availability-honesty"><i class="bi bi-info-circle"></i><span>Availability is based on current reservations. Your booking is not held until you submit a reservation request.</span></div><label class="reservation-request-label" for="reservationSpecialRequests">Special requests (optional)</label><textarea id="reservationSpecialRequests" maxlength="1000" rows="3" placeholder="Arrival time, accessibility needs, or other requests"></textarea><button type="button" class="detail-book-btn reservation-submit-btn" id="createReservation"><i class="bi bi-calendar2-check"></i> Request reservation</button><div id="reservationSubmitMessage" class="availability-message" aria-live="polite"></div>' : '<div class="availability-honesty"><i class="bi bi-info-circle"></i><span>Those dates do not have enough units for your request. Update the dates or reduce the number of rooms.</span></div>');
        availabilityResults.hidden = false;
        availabilityResults.scrollIntoView({ behavior: "smooth", block: "start" });
        if (available) {
          document.getElementById("createReservation").addEventListener("click", async () => {
            const submit = document.getElementById("createReservation");
            const status = document.getElementById("reservationSubmitMessage");
            const token = sessionStorage.getItem("roomoGuestToken") || localStorage.getItem("roomoGuestToken");
            if (!token) {
              const returnTo = location.pathname + location.search + location.hash;
              location.href = "roomo-login.html?returnTo=" + encodeURIComponent(returnTo);
              return;
            }
            submit.disabled = true;
            submit.innerHTML = '<span class="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>Submitting…';
            status.classList.remove("is-error");
            try {
              const bookingResponse = await fetch("http://localhost:5001/api/reservations", {
                method: "POST",
                headers: { "Content-Type": "application/json", "Authorization": "Bearer " + token },
                body: JSON.stringify({ propertyId: stay.id, checkIn: arrival, checkOut: departure, adults: guestAdults, children: guestChildren, rooms: roomCount, specialRequests: document.getElementById("reservationSpecialRequests")?.value || "" })
              });
              const bookingData = await bookingResponse.json().catch(() => ({}));
              if (bookingResponse.status === 401) {
                location.href = "roomo-login.html?returnTo=" + encodeURIComponent(location.pathname + location.search + location.hash);
                return;
              }
              if (!bookingResponse.ok) {
                if (bookingResponse.status === 409) status.classList.add("is-error");
                throw new Error(bookingData.message || "Could not create your reservation.");
              }
              const reservation = bookingData.reservation;
              availabilityResults.innerHTML = '<div class="availability-results-head"><div><span class="detail-eyebrow">RESERVATION REQUESTED</span><h2>Your stay request has been received</h2><p>' + arrival + ' → ' + departure + ' · ' + data.nights + ' night(s)</p></div><span class="availability-search-check">Pending confirmation</span></div><div class="reservation-confirmation"><i class="bi bi-check-circle-fill"></i><div><strong>Reservation reference: ' + reservation.reservationCode + '</strong><p>' + reservation.property.title + ' · ' + money(reservation.totalAmount) + ' estimated total</p><p>The property must confirm this request. No payment has been collected.</p></div></div><a class="detail-book-btn reservation-view-btn" href="roomo-my-bookings.html">View my reservations</a>';
            } catch (error) {
              status.textContent = error.message || "Could not create your reservation.";
              status.classList.add("is-error");
              submit.disabled = false;
              submit.innerHTML = '<i class="bi bi-calendar2-check"></i> Try reservation again';
            }
          });
        }
      } catch (error) {
        availabilityMessage.textContent = error.message || "Unable to check availability right now.";
        availabilityMessage.classList.add("is-error");
      } finally {
        button.disabled = false;
        button.innerHTML = '<i class="bi bi-search"></i> Check availability';
      }
    }
    document.getElementById("checkAvailability").addEventListener("click", runAvailabilitySearch);
  } else if (root) root.innerHTML = '<div class="detail-not-found"><h1>Stay not found</h1><p>Please return to the listings and choose a stay.</p><a href="roomo-search-results.html">Browse stays</a></div>';
  })();
}

// ROOMO guest reservations — view and cancel bookings
if (document.body.classList.contains("my-bookings-page")) {
  (async function loadGuestReservations() {
    const list = document.getElementById("myBookingsList");
    const message = document.getElementById("myBookingsMessage");
    const token = sessionStorage.getItem("roomoGuestToken") || localStorage.getItem("roomoGuestToken");
    if (!token) {
      const returnTo = location.pathname + location.search + location.hash;
      location.replace("roomo-login.html?returnTo=" + encodeURIComponent(returnTo));
      return;
    }
    const escapeHTML = value => String(value ?? "").replace(/[&<>"']/g, char => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[char]));
    const formatDate = value => new Date(String(value).slice(0,10) + "T12:00:00").toLocaleDateString("en-IN", { day:"numeric", month:"short", year:"numeric" });
    const money = value => "₹" + Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits:2 });
    function render(reservations) {
      if (!reservations.length) {
        list.innerHTML = '<div class="booking-empty"><i class="bi bi-calendar2-heart"></i><h2>No reservations yet</h2><p>Choose a stay and check availability to start planning your visit.</p><a class="detail-book-btn reservation-view-btn" href="roomo-search-results.html">Explore stays</a></div>';
        return;
      }
      list.innerHTML = '<div class="booking-list">' + reservations.map(item => {
        const property = item.property || {};
        const image = property.images?.[0]?.imageUrl;
        const status = String(item.status || "REQUESTED").toLowerCase();
        const canCancel = status !== "cancelled" && new Date(String(item.checkIn).slice(0,10) + "T00:00:00") > new Date(new Date().toISOString().slice(0,10) + "T00:00:00");
        return '<article class="booking-card" data-reservation-id="' + escapeHTML(item.id) + '"><img class="booking-card-image" src="' + escapeHTML(image || "https://placehold.co/240x240/eaf1f8/45617c?text=ROOMO") + '" alt="' + escapeHTML(property.title || "ROOMO stay") + '"><div><h2>' + escapeHTML(property.title || "Your stay") + '</h2><p><i class="bi bi-geo-alt"></i> ' + escapeHTML([property.city, property.address].filter(Boolean).join(", ")) + '</p><p><i class="bi bi-calendar3"></i> ' + escapeHTML(formatDate(item.checkIn)) + ' – ' + escapeHTML(formatDate(item.checkOut)) + ' · ' + escapeHTML(item.nights) + ' night(s)</p><p><i class="bi bi-people"></i> ' + escapeHTML(item.adults) + ' adults · ' + escapeHTML(item.children) + ' children · ' + escapeHTML(item.roomCount) + ' room(s)</p><p class="booking-reference">Reference: ' + escapeHTML(item.reservationCode) + '</p><span class="booking-status ' + escapeHTML(status) + '">' + escapeHTML(status === "requested" ? "Pending confirmation" : status) + '</span>' + (canCancel ? '<div><button type="button" class="booking-cancel" data-cancel-reservation="' + escapeHTML(item.id) + '">Cancel reservation</button></div>' : '') + '</div><div class="booking-card-total">' + money(item.totalAmount) + '<p>estimated total</p></div></article>';
      }).join("") + '</div>';
    }
    async function load() {
      try {
        const response = await fetch("http://localhost:5001/api/reservations/mine", { headers: { Authorization: "Bearer " + token }, cache: "no-store" });
        const data = await response.json().catch(() => ({}));
        if (response.status === 401) {
          sessionStorage.removeItem("roomoGuestToken"); localStorage.removeItem("roomoGuestToken");
          location.replace("roomo-login.html?returnTo=" + encodeURIComponent(location.pathname + location.search));
          return;
        }
        if (!response.ok) throw new Error(data.message || "Could not load your reservations.");
        render(data.reservations || []);
        message.textContent = "";
      } catch (error) {
        message.textContent = error.message || "Could not load your reservations.";
      }
    }
    list.addEventListener("click", async event => {
      const button = event.target.closest("[data-cancel-reservation]");
      if (!button) return;
      if (!window.confirm("Cancel this reservation request?")) return;
      button.disabled = true;
      button.textContent = "Cancelling…";
      try {
        const response = await fetch("http://localhost:5001/api/reservations/" + encodeURIComponent(button.dataset.cancelReservation) + "/cancel", {
          method: "PATCH", headers: { Authorization: "Bearer " + token }
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.message || "Could not cancel this reservation.");
        message.textContent = data.message || "Reservation cancelled.";
        await load();
      } catch (error) {
        message.textContent = error.message || "Could not cancel this reservation.";
        button.disabled = false;
        button.textContent = "Cancel reservation";
      }
    });
    await load();
  })();
}

// ROOMO guest authentication — email and password
(function () {
  "use strict";

  const API_BASE_URL = "http://localhost:5001";
  const TOKEN_KEY = "roomoGuestToken";
  const USER_KEY = "roomoGuest";
  const body = document.body;

  if (!body.classList.contains("auth-page") || !["login", "signup"].includes(body.dataset.authPage)) return;

  const $ = (id) => document.getElementById(id);
  const form = $("authForm");
  const messageBox = $("message");
  const submitBtn = $("submitBtn");
  const switchText = $("switchText");
  const passwordInput = $("password");
  const fullNameInput = $("fullName");
  if (!form || !messageBox || !submitBtn || !passwordInput) {
    console.error("ROOMO: Required guest authentication form elements are missing.");
    return;
  }

  let mode = body.dataset.authPage;
  let busy = false;

  function showMessage(message, type = "error", allowResend = false) {
    messageBox.textContent = message;
    messageBox.className = `message show ${type}`;
    if (allowResend) {
      const resendButton = document.createElement("button");
      resendButton.type = "button";
      resendButton.textContent = "Resend verification email";
      resendButton.className = "verification-resend-btn";
      resendButton.style.cssText = "display:block;margin:12px auto 0;padding:9px 14px;border:1px solid currentColor;border-radius:7px;background:transparent;font:inherit;font-weight:700;cursor:pointer";
      resendButton.addEventListener("click", async () => {
        const email = $("email")?.value.trim().toLowerCase();
        if (!email) return showMessage("Enter your email address first.");
        resendButton.disabled = true;
        resendButton.textContent = "SENDING…";
        try {
          const result = await sendGuestAuthRequest("/resend-verification", { email });
          showMessage(result.message || "Check your inbox for a new verification link.", "success");
        } catch (error) {
          showMessage(error.message || "Unable to resend the verification email.");
        }
      });
      messageBox.appendChild(resendButton);
    }
  }
  function clearMessage() {
    messageBox.textContent = "";
    messageBox.className = "message";
  }
  function setBusy(value) {
    busy = value;
    submitBtn.disabled = value;
    submitBtn.style.opacity = value ? "0.65" : "1";
    submitBtn.textContent = value ? "PLEASE WAIT…" : mode === "signup" ? "CREATE ACCOUNT" : "SIGN IN";
  }
  function setMode(nextMode) {
    mode = nextMode;
    clearMessage();
    const isSignup = mode === "signup";
    $("eyebrow").textContent = isSignup ? "BEGIN YOUR JOURNEY" : "WELCOME BACK";
    $("heading").innerHTML = isSignup ? "Create your<br>sanctuary account." : "Sign in to your<br>sanctuary.";
    $("subheading").textContent = isSignup
      ? "Create an account to save your favourite stays and keep your pilgrimage plans close."
      : "Continue your pilgrimage journey and access your saved stays.";
    $("nameField")?.classList.toggle("hidden", !isSignup);
    $("phoneField")?.classList.toggle("hidden", !isSignup);
    const phoneInput = $("phoneNumber");
    if (phoneInput) phoneInput.required = isSignup;
    $("loginOptions")?.classList.toggle("hidden", isSignup);
    if (fullNameInput) fullNameInput.required = isSignup;
    passwordInput.required = true;
    passwordInput.minLength = isSignup ? 12 : 1;
    passwordInput.autocomplete = isSignup ? "new-password" : "current-password";
    submitBtn.textContent = isSignup ? "CREATE ACCOUNT" : "SIGN IN";
    if (switchText) {
      switchText.innerHTML = isSignup
        ? 'Already have an account? <button type="button" id="switchMode">Sign in</button>'
        : 'New to ROOMO Sacred? <button type="button" id="switchMode">Create an account</button>';
      $("switchMode")?.addEventListener("click", () => {
        window.location.href = isSignup ? "roomo-login.html" : "roomo-signup.html";
      });
    }
  }

  async function initializeGoogleSignIn() {
    const fallback = $("googleSignInFallback");
    const container = $("googleSignInButton");
    if (!fallback || !container) return;

    async function setupGoogleButton() {
      const response = await fetch(`${API_BASE_URL}/api/guest-auth/config`);
      const config = await response.json().catch(() => ({}));
      if (!response.ok || !config.googleClientId) {
        throw new Error("Google sign-in is not configured yet. Add GOOGLE_CLIENT_ID to the backend .env file and restart the API.");
      }
      if (!window.google?.accounts?.id) {
        await new Promise((resolve, reject) => {
          const script = document.createElement("script");
          script.src = "https://accounts.google.com/gsi/client";
          script.async = true;
          script.defer = true;
          script.onload = resolve;
          script.onerror = () => reject(new Error("Google sign-in could not load. Check your internet connection and try again."));
          document.head.appendChild(script);
        });
      }
      container.replaceChildren();
      window.google.accounts.id.initialize({
        client_id: config.googleClientId,
        callback: async (response) => {
          if (!response.credential) return showMessage("Google did not return a sign-in credential.");
          if (busy) return;
          setBusy(true);
          clearMessage();
          try {
            const data = await sendGuestAuthRequest("/google", { credential: response.credential });
            saveGuestSession(data);
            showMessage("You are signed in with Google successfully.", "success");
          } catch (error) {
            showMessage(error.message || "Google sign-in failed. Please try again.");
          } finally {
            setBusy(false);
          }
        }
      });
      // Keep the visible fallback in place until Google has actually rendered
      // its button. renderButton() can return before its iframe is ready.
      const hideFallbackWhenReady = () => {
        if (container.querySelector("iframe")) {
          fallback.hidden = true;
          observer.disconnect();
        }
      };
      const observer = new MutationObserver(hideFallbackWhenReady);
      observer.observe(container, { childList: true, subtree: true });

      window.google.accounts.id.renderButton(container, {
        type: "standard", theme: "outline", size: "large",
        text: mode === "signup" ? "signup_with" : "signin_with",
        shape: "rectangular", width: Math.min(360, Math.max(240, Math.floor(container.clientWidth || 320)))
      });
      hideFallbackWhenReady();
    }

    fallback.addEventListener("click", async () => {
      fallback.disabled = true;
      fallback.textContent = "Opening Google sign-in…";
      clearMessage();
      try {
        await setupGoogleButton();

        // The fallback is a real action: initialize Google and request its
        // sign-in prompt, rather than only rendering a separate button.
        window.google.accounts.id.prompt((notification) => {
          if (notification.isNotDisplayed?.() || notification.isSkippedMoment?.()) {
            showMessage(
              "Google sign-in was blocked or dismissed by the browser. Use the official Google button shown above, check your browser's pop-up/privacy settings, and try again."
            );
          }
        });
      } catch (error) {
        showMessage(error.message || "Google sign-in could not be initialized.");
      } finally {
        fallback.disabled = false;
        fallback.textContent = "Continue with Google";
      }
    });

    try {
      await setupGoogleButton();
    } catch (error) {
      console.info("ROOMO Google sign-in:", error.message);
    }
  }

  async function sendGuestAuthRequest(endpoint, payload) {
    let response;
    try {
      response = await fetch(`${API_BASE_URL}/api/guest-auth${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
    } catch {
      throw new Error("Unable to connect to ROOMO. Make sure the backend is running on port 5001.");
    }
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      if (response.status === 429) throw new Error("Too many attempts. Please wait a few minutes and try again.");
      const error = new Error(data.message || "Authentication failed. Please try again.");
      error.code = data.code || null;
      error.status = response.status;
      throw error;
    }
    return data;
  }

  function saveGuestSession(data) {
    if (!data.token || !data.user) throw new Error("The server response is missing the guest session.");
    const remember = $("remember");
    const storage = mode === "login" && remember && !remember.checked ? sessionStorage : localStorage;
    storage.setItem(TOKEN_KEY, data.token);
    storage.setItem(USER_KEY, JSON.stringify(data.user));
    (storage === sessionStorage ? localStorage : sessionStorage).removeItem(TOKEN_KEY);
    (storage === sessionStorage ? localStorage : sessionStorage).removeItem(USER_KEY);

    // Return guests to the page where they started sign-in. Only allow same-origin
    // destinations so a crafted URL cannot redirect guests to an external site.
    const returnTo = new URLSearchParams(window.location.search).get("returnTo");
    if (returnTo) {
      try {
        const destination = new URL(returnTo, window.location.origin);
        if (destination.origin === window.location.origin) {
          window.location.replace(destination.href);
          return;
        }
      } catch (error) {
        console.warn("ROOMO: Invalid post-authentication return URL.", error);
      }
    }
    window.location.replace("index.html");
  }

  function showMobileOtpPrompt(phoneNumber, accountType = "GUEST") {
    const wrapper = document.createElement("div");
    wrapper.style.cssText = "display:grid;gap:10px;margin-top:14px;text-align:left";
    const label = document.createElement("label");
    label.textContent = "6-digit mobile verification code";
    label.htmlFor = "mobileOtpCode";
    label.style.cssText = "font-weight:700;font-size:13px";
    const input = document.createElement("input");
    input.id = "mobileOtpCode";
    input.type = "text";
    input.inputMode = "numeric";
    input.autocomplete = "one-time-code";
    input.maxLength = 6;
    input.pattern = "[0-9]{6}";
    input.placeholder = "Enter the code";
    input.style.cssText = "width:100%;padding:12px;border:1px solid #cbd5e1;border-radius:8px;font:inherit";
    const verify = document.createElement("button");
    verify.type = "button";
    verify.textContent = "VERIFY MOBILE";
    verify.className = "primary-btn";
    verify.style.cssText = "width:100%;margin-top:2px";
    const status = document.createElement("p");
    status.style.cssText = "margin:0;font-size:13px";
    status.setAttribute("role", "status");
    verify.addEventListener("click", async () => {
      const code = input.value.trim();
      if (!/^[0-9]{6}$/.test(code)) {
        status.textContent = "Enter the six-digit code.";
        return;
      }
      verify.disabled = true;
      verify.textContent = "VERIFYING…";
      try {
        const response = await fetch(`${API_BASE_URL}/api/mobile-verification/verify`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ accountType, phoneNumber, code })
        });
        const result = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(result.message || "Mobile verification failed.");
        status.textContent = result.message || "Mobile number verified. Continue with email verification.";
        status.style.color = "#177245";
        verify.textContent = "MOBILE VERIFIED";
        input.disabled = true;
        verify.disabled = true;
      } catch (error) {
        status.textContent = error.message || "Unable to verify this code.";
        status.style.color = "#b42318";
        verify.disabled = false;
        verify.textContent = "VERIFY MOBILE";
      }
    });
    const resend = document.createElement("button");
    resend.type = "button";
    resend.textContent = "Resend code";
    resend.style.cssText = "border:0;background:transparent;text-decoration:underline;font:inherit;font-size:13px;cursor:pointer";
    resend.addEventListener("click", async () => {
      resend.disabled = true;
      try {
        const response = await fetch(`${API_BASE_URL}/api/mobile-verification/send`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ accountType, phoneNumber })
        });
        const result = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(result.message || "Could not resend the code.");
        status.textContent = result.message || "If the account exists, a new code has been sent.";
        status.style.color = "#177245";
      } catch (error) {
        status.textContent = error.message || "Could not resend the code.";
        status.style.color = "#b42318";
      } finally {
        resend.disabled = false;
      }
    });
    wrapper.append(label, input, verify, resend, status);
    messageBox.appendChild(wrapper);
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (busy) return;
    clearMessage();
    const email = $("email")?.value.trim().toLowerCase();
    const password = passwordInput.value;
    if (!email || !password) return showMessage("Please enter your email address and password.");
    if (mode === "signup") {
      const fullName = fullNameInput?.value.trim();
      if (!fullName || fullName.length < 2) {
        showMessage("Please enter your full name.");
        fullNameInput?.focus();
        return;
      }
      if (password.length < 12) {
        showMessage("Please use a password with at least 12 characters.");
        passwordInput.focus();
        return;
      }
    }
    setBusy(true);
    try {
      const phoneNumber = $("phoneNumber")?.value.trim();
      const data = await sendGuestAuthRequest(mode === "signup" ? "/register" : "/login",
        mode === "signup" ? { fullName: fullNameInput.value.trim(), email, phoneNumber, password } : { email, password });
      if (mode === "signup" && data.verificationRequired) {
        showMessage("Your account has been created. Verify your mobile number below, then check your inbox for the email verification link.", "success");
        showMobileOtpPrompt(phoneNumber, "GUEST");
        return;
      }
      saveGuestSession(data);
      showMessage(mode === "signup" ? "Your ROOMO account has been created successfully. You are now signed in." : "You are signed in successfully.", "success");
    } catch (error) {
      showMessage(error.message || "Unable to authenticate. Please try again.", "error", error.code === "EMAIL_NOT_VERIFIED" || error.code === "VERIFICATION_EMAIL_FAILED");
      if (mode === "signup" && error.code === "VERIFICATION_EMAIL_FAILED") {
        showMobileOtpPrompt($("phoneNumber")?.value.trim(), "GUEST");
      }
    } finally {
      setBusy(false);
    }
  });

  $("togglePassword")?.addEventListener("click", () => {
    const visible = passwordInput.type === "password";
    passwordInput.type = visible ? "text" : "password";
    $("togglePassword").innerHTML = visible ? '<i class="bi bi-eye-slash"></i>' : '<i class="bi bi-eye"></i>';
    $("togglePassword").setAttribute("aria-label", visible ? "Hide password" : "Show password");
  });
  $("forgotLink")?.addEventListener("click", (event) => {
    event.preventDefault();
    showMessage("Password reset is not available yet. Please contact the ROOMO team for assistance.");
  });

  setMode(mode);
  // Wire up the Google button on both login and signup pages.
  initializeGoogleSignIn();

  window.ROOMO_GUEST_AUTH = {
    getToken() { return sessionStorage.getItem(TOKEN_KEY) || localStorage.getItem(TOKEN_KEY); },
    getUser() {
      const value = sessionStorage.getItem(USER_KEY) || localStorage.getItem(USER_KEY);
      if (!value) return null;
      try { return JSON.parse(value); } catch { return null; }
    },
    async getCurrentUser() {
      const token = this.getToken();
      if (!token) return null;
      const response = await fetch(`${API_BASE_URL}/api/guest-auth/me`, { headers: { Authorization: `Bearer ${token}` } });
      if (!response.ok) {
        this.logout();
        return null;
      }
      const data = await response.json();
      if (data.user) {
        const storage = sessionStorage.getItem(TOKEN_KEY) ? sessionStorage : localStorage;
        storage.setItem(USER_KEY, JSON.stringify(data.user));
      }
      return data.user || null;
    },
    logout() {
      sessionStorage.removeItem(TOKEN_KEY);
      sessionStorage.removeItem(USER_KEY);
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      window.location.href = "roomo-login.html";
    }
  };
})();
