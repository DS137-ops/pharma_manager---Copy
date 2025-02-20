const cron = require("node-cron");
const Booking = require("./model/book.model"); // تأكد من أن المسار صحيح
const Doctor = require("./model/doctor.model"); // تأكد من أن المسار صحيح
const mongoose = require("mongoose");

const updateBookingsForNextWeek = async () => {
    try {
        console.log("🔄 تحديث الحجوزات للأسبوع القادم...");

        // جلب جميع الحجوزات التي انتهى وقتها
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const expiredBookings = await Booking.find({ date: { $lt: today } });

        for (let booking of expiredBookings) {
            // احصل على الطبيب المرتبط بهذا الحجز
            const doctor = await Doctor.findById(booking.doctorId);

            if (doctor) {
                // إعادة فتح نفس الوقت للأسبوع القادم
                const nextWeekDate = new Date(booking.date);
                nextWeekDate.setDate(nextWeekDate.getDate() + 7); // +7 أيام

                // تحديث جدول الحجوزات بإضافة نفس التوقيت للأسبوع القادم
                await Booking.create({
                    doctorId: booking.doctorId,
                    patientId: null, // لا يوجد مريض بعد
                    date: nextWeekDate,
                    timeSlot: booking.timeSlot,
                    status: "available"
                });

                console.log(`✅ إعادة فتح وقت ${booking.timeSlot} ليوم ${nextWeekDate.toISOString().slice(0, 10)}`);
            }
        }

        console.log("✅ تم تحديث الحجوزات للأسبوع القادم بنجاح.");
    } catch (error) {
        console.error("❌ خطأ في تحديث الحجوزات:", error.message);
    }
};

// تشغيل المهمة المجدولة يوميًا عند منتصف الليل
cron.schedule("0 0 * * *", updateBookingsForNextWeek);

module.exports = updateBookingsForNextWeek;
