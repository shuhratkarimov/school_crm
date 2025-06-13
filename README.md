👥 Jamoa uchun GitHub ishlash tartibi

🔰 1. Repositoryga ulanish
Men repositoryni yaratdim va sizni Collaborator sifatida qo‘shaman.

Siz email orqali taklif olasiz — qabul qilib qo‘shilasiz.

Kompyuteringizda quyidagicha clone qilasiz:
git clone https://github.com/shuhratkarimov/crm-system.git


🌿 2. O‘z branch'ingizni yarating
👉 Hech kim main branchga to‘g‘ridan-to‘g‘ri push qilmaydi!

Yangi branch oching (ismingiz yoki vazifangiz bilan):

git checkout -b adminpanel/shoxruz (bu yerda adminpanel o'rnida masalan, main page yoki boshqa bo'lishi va shoxruz ismi boshqa ism bilan almashtirilishi mumkin)
O‘zgarishlar kiriting, so‘ng:

git add .
git commit -m "Shoxruz: login form qo‘shildi"
git push origin feature/ali-login

🔁 3. Pull Request yuborish
GitHub sahifasiga kirasiz, siz push qilgan branchni ko‘rishingiz kerak.

Compare & pull request tugmasini bosing.

Qisqacha izoh yozing (nima o‘zgartirdingiz).

"Create pull request" tugmasini bosing.

🧪 4. Kodingiz tekshiriladi
Men kodni ko‘rib chiqaman.

Agar hammasi joyida bo‘lsa, main branchga birlashtirib qo‘yaman (merge).

Agar kamchilik bo‘lsa, izoh qoldiriladi va siz uni tuzatasiz.

🔄 5. Yangilanishlarni olish
Doimiy yangilanishlarni olish uchun:

git checkout main
git pull origin main
Yoki agar o‘z branchingizda bo‘lsangiz:

git fetch origin
git merge origin/main
💡 Qoida:
Har kim o‘z branchida ishlaydi. main faqat tozalangan, ishlaydigan kodlar uchun!

📌 Misol:
👉 Xusniddin main page ustida ishlamoqda:

git checkout -b feature/xusniddin-mainpage
Kod yozadi, push qiladi, so‘ng GitHub’da pull request ochadi.