const Doctor = require('../model/doctor.model');

const doctorsData = [
  {
    fullName: "fras ahmad",
    email: "fras112@gmail.com",
    password: "mahmoud123456",
    city: "Aliskandreh",
    region: "Domeat",
    address: "Altawra",
    phone: "+201172921272",
    specilizate: "أسنان",
    NumberState: 4,
    imageUrl:"https://res.cloudinary.com/dqk8dzdoo/image/upload/v1747665924/pharmacies/s576ijitsljid2h2twwf.jpg",
     Gallery:[
    {imageUrl:"https://res.cloudinary.com/dqk8dzdoo/image/upload/v1747905675/gall1_kaocwx.jpg" },
    {imageUrl:"https://res.cloudinary.com/dqk8dzdoo/image/upload/v1747905687/gal2_gfrjep.jpg" },

  ],
  rate: [
      {
        userId:"682e27ecf042a13bb628d1b9" ,
        rating: 3.3
      },
    ],
    rangeBooking: [
       {
      day: 0,
      start: 9 ,
      end: 12
    },
    {
      day: 1,
      start: 9,
      end: 15
    },
    {
      day:2,
      start: 10,
      end: 2
    },
    {
      day: 3,
      start: 10,
      end: 2
    },
    {
      day: 4,
      start: 10,
      end: 2
    },
    {
      day: 5,
      start: 10,
      end: 2
    },
     {
      day: 6,
      start: 10,
      end: 2
    }
  ]
  },
  {
    fullName: "ali khalil",
    email: "ali@gmail.com",
    password: "ali123456",
    city: "Aliskandreh",
    region: "Domeat",
    address: "Altawra",
    phone: "+201272921200",
    specilizate: "أسنان",
    NumberState: 2,
        imageUrl:"https://res.cloudinary.com/dqk8dzdoo/image/upload/v1747665924/pharmacies/s576ijitsljid2h2twwf.jpg",
  Gallery:[
    {imageUrl:"https://res.cloudinary.com/dqk8dzdoo/image/upload/v1747905675/gall1_kaocwx.jpg" },
    {imageUrl:"https://res.cloudinary.com/dqk8dzdoo/image/upload/v1747905687/gal2_gfrjep.jpg" },

  ],
  rate: [
      {
        userId:"682e27ecf042a13bb628d1b9" ,
        rating: 4.2
      },
    ],
     rangeBooking: [
       {
      day: 0,
      start: 9 ,
      end: 12
    },
    {
      day: 1,
      start: 9,
      end: 15
    },
    {
      day:2,
      start: 10,
      end: 2
    },
    {
      day: 3,
      start: 10,
      end: 2
    },
    {
      day: 4,
      start: 10,
      end: 2
    },
    {
      day: 5,
      start: 10,
      end: 2
    },
     {
      day: 6,
      start: 10,
      end: 2
    }
  ]
  },
   {
    fullName: "nour kasem",
    email: "nour@gmail.com",
    password: "ali123456",
    city: "Aliskandreh",
    region: "Domeat",
    address: "Altawra",
    phone: "+201272971009",
    specilizate: "أسنان",
    NumberState: 2,
        imageUrl:"https://res.cloudinary.com/dqk8dzdoo/image/upload/v1747665924/pharmacies/s576ijitsljid2h2twwf.jpg",
          Gallery:[
    {imageUrl:"https://res.cloudinary.com/dqk8dzdoo/image/upload/v1747905675/gall1_kaocwx.jpg" },
    {imageUrl:"https://res.cloudinary.com/dqk8dzdoo/image/upload/v1747905687/gal2_gfrjep.jpg" },

  ],
  rate: [
      {
        userId:"682e27ecf042a13bb628d1b9" ,
        rating: 2.8
      },
    ],
    rangeBooking: [
       {
      day: 0,
      start: 9 ,
      end: 12
    },
    {
      day: 1,
      start: 9,
      end: 15
    },
    {
      day:2,
      start: 10,
      end: 2
    },
    {
      day: 3,
      start: 10,
      end: 2
    },
    {
      day: 4,
      start: 10,
      end: 2
    },
    {
      day: 5,
      start: 10,
      end: 2
    },
     {
      day: 6,
      start: 10,
      end: 2
    }
  ]
  },
  {
    fullName: "ammar soliman",
    email: "ammar@gmail.com",
    password: "ammar123456",
    city: "Aliskandreh",
    region: "Domeat",
    address: "Altawra",
    phone: "+201272921897",
    specilizate: "أسنان",
    NumberState: 2,
        imageUrl:"https://res.cloudinary.com/dqk8dzdoo/image/upload/v1747665924/pharmacies/s576ijitsljid2h2twwf.jpg",
          Gallery:[
    {imageUrl:"https://res.cloudinary.com/dqk8dzdoo/image/upload/v1747905675/gall1_kaocwx.jpg" },
    {imageUrl:"https://res.cloudinary.com/dqk8dzdoo/image/upload/v1747905687/gal2_gfrjep.jpg" },

  ],
  rate: [
      {
        userId:"682e27ecf042a13bb628d1b9" ,
        rating: 4.4
      },
    ],
     rangeBooking: [
       {
      day: 0,
      start: 9 ,
      end: 12
    },
    {
      day: 1,
      start: 9,
      end: 15
    },
    {
      day:2,
      start: 10,
      end: 2
    },
    {
      day: 3,
      start: 10,
      end: 2
    },
    {
      day: 4,
      start: 10,
      end: 2
    },
    {
      day: 5,
      start: 10,
      end: 2
    },
     {
      day: 6,
      start: 10,
      end: 2
    }
  ]

  },
  {
    fullName: "younis hilal",
    email: "youniss@gmail.com",
    password: "younis123456",
    city: "Aliskandreh",
    region: "Domeat",
    address: "Altawra",
    phone: "+201272121272",
    specilizate: "أسنان",
    NumberState: 2,
        imageUrl:"https://res.cloudinary.com/dqk8dzdoo/image/upload/v1747665924/pharmacies/s576ijitsljid2h2twwf.jpg",
          Gallery:[
    {imageUrl:"https://res.cloudinary.com/dqk8dzdoo/image/upload/v1747905675/gall1_kaocwx.jpg" },
    {imageUrl:"https://res.cloudinary.com/dqk8dzdoo/image/upload/v1747905687/gal2_gfrjep.jpg" },

  ],
  rate: [
      {
        userId:"682e27ecf042a13bb628d1b9" ,
        rating: 5
      },
    ],
    rangeBooking: [
       {
      day: 0,
      start: 9 ,
      end: 12
    },
    {
      day: 1,
      start: 9,
      end: 15
    },
    {
      day:2,
      start: 10,
      end: 2
    },
    {
      day: 3,
      start: 10,
      end: 2
    },
    {
      day: 4,
      start: 10,
      end: 2
    },
    {
      day: 5,
      start: 10,
      end: 2
    },
     {
      day: 6,
      start: 10,
      end: 2
    }
  ]

  },
  {
    fullName: "younis hilal",
    email: "younis@gmail.com",
    password: "younis123456",
    city: "Aliskandreh",
    region: "Domeat",
    address: "Altawra",
    phone: "+201272121272",
    specilizate: "قلب و أوعية دموية",
    NumberState: 2,
        imageUrl:"https://res.cloudinary.com/dqk8dzdoo/image/upload/v1747665924/pharmacies/s576ijitsljid2h2twwf.jpg",
          Gallery:[
    {imageUrl:"https://res.cloudinary.com/dqk8dzdoo/image/upload/v1747905675/gall1_kaocwx.jpg" },
    {imageUrl:"https://res.cloudinary.com/dqk8dzdoo/image/upload/v1747905687/gal2_gfrjep.jpg" },

  ],
  rate: [
      {
        userId:"682e27ecf042a13bb628d1b9" ,
        rating: 1.7
      },
    ],
    rangeBooking: [
       {
      day: 0,
      start: 9 ,
      end: 12
    },
    {
      day: 1,
      start: 9,
      end: 15
    },
    {
      day:2,
      start: 10,
      end: 2
    },
    {
      day: 3,
      start: 10,
      end: 2
    },
    {
      day: 4,
      start: 10,
      end: 2
    },
    {
      day: 5,
      start: 10,
      end: 2
    },
     {
      day: 6,
      start: 10,
      end: 2
    }
  ]

  },
  {
    fullName: "ali sliman",
    email: "alis@gmail.com",
    password: "younis123456",
    city: "Aliskandreh",
    region: "Domeat",
    address: "Altawra",
    phone: "+201275121272",
    specilizate: "قلب و أوعية دموية",
    NumberState: 2,
        imageUrl:"https://res.cloudinary.com/dqk8dzdoo/image/upload/v1747665924/pharmacies/s576ijitsljid2h2twwf.jpg",
          Gallery:[
    {imageUrl:"https://res.cloudinary.com/dqk8dzdoo/image/upload/v1747905675/gall1_kaocwx.jpg" },
    {imageUrl:"https://res.cloudinary.com/dqk8dzdoo/image/upload/v1747905687/gal2_gfrjep.jpg" },

  ],
  rate: [
      {
        userId:"682e27ecf042a13bb628d1b9" ,
        rating: 3.3
      },
    ],
    rangeBooking: [
       {
      day: 0,
      start: 9 ,
      end: 12
    },
    {
      day: 1,
      start: 9,
      end: 15
    },
    {
      day:2,
      start: 10,
      end: 2
    },
    {
      day: 3,
      start: 10,
      end: 2
    },
    {
      day: 4,
      start: 10,
      end: 2
    },
    {
      day: 5,
      start: 10,
      end: 2
    },
     {
      day: 6,
      start: 10,
      end: 2
    }
  ]

  },
  {
    fullName: "nour mehob",
    email: "nourm@gmail.com",
    password: "younis123456",
    city: "Aliskandreh",
    region: "Domeat",
    address: "Altawra",
    phone: "+201275621272",
    specilizate: "قلب و أوعية دموية",
    NumberState: 2,
        imageUrl:"https://res.cloudinary.com/dqk8dzdoo/image/upload/v1747665924/pharmacies/s576ijitsljid2h2twwf.jpg",
          Gallery:[
    {imageUrl:"https://res.cloudinary.com/dqk8dzdoo/image/upload/v1747905675/gall1_kaocwx.jpg" },
    {imageUrl:"https://res.cloudinary.com/dqk8dzdoo/image/upload/v1747905687/gal2_gfrjep.jpg" },

  ],
  rate: [
      {
        userId:"682e27ecf042a13bb628d1b9" ,
        rating: 4.9
      },
    ],
     rangeBooking: [
       {
      day: 0,
      start: 9 ,
      end: 12
    },
    {
      day: 1,
      start: 9,
      end: 15
    },
    {
      day:2,
      start: 10,
      end: 2
    },
    {
      day: 3,
      start: 10,
      end: 2
    },
    {
      day: 4,
      start: 10,
      end: 2
    },
    {
      day: 5,
      start: 10,
      end: 2
    },
     {
      day: 6,
      start: 10,
      end: 2
    }
  ]

  },
  {
    fullName: "tony asad",
    email: "tony@gmail.com",
    password: "younis123456",
    city: "Aliskandreh",
    region: "Domeat",
    address: "Altawra",
    phone: "+201275621209",
    specilizate: "أنف و أذن و حنجرة",
    NumberState: 3,
        imageUrl:"https://res.cloudinary.com/dqk8dzdoo/image/upload/v1747665924/pharmacies/s576ijitsljid2h2twwf.jpg",
          Gallery:[
    {imageUrl:"https://res.cloudinary.com/dqk8dzdoo/image/upload/v1747905675/gall1_kaocwx.jpg" },
    {imageUrl:"https://res.cloudinary.com/dqk8dzdoo/image/upload/v1747905687/gal2_gfrjep.jpg" },

  ],
  rate: [
      {
        userId:"682e27ecf042a13bb628d1b9" ,
        rating: 1.3
      },
    ],
    rangeBooking: [
       {
      day: 0,
      start: 9 ,
      end: 12
    },
    {
      day: 1,
      start: 9,
      end: 15
    },
    {
      day:2,
      start: 10,
      end: 2
    },
    {
      day: 3,
      start: 10,
      end: 2
    },
    {
      day: 4,
      start: 10,
      end: 2
    },
    {
      day: 5,
      start: 10,
      end: 2
    },
     {
      day: 6,
      start: 10,
      end: 2
    }
  ]

  },
 {
    fullName: "Asaad asad",
    email: "Asaadd@gmail.com",
    password: "Asaad123456",
    city: "Aliskandreh",
    region: "Domeat",
    address: "Altawra",
    phone: "+201275141209",
    specilizate: "أنف و أذن و حنجرة",
    NumberState: 3,
        imageUrl:"https://res.cloudinary.com/dqk8dzdoo/image/upload/v1747665924/pharmacies/s576ijitsljid2h2twwf.jpg",
          Gallery:[
    {imageUrl:"https://res.cloudinary.com/dqk8dzdoo/image/upload/v1747905675/gall1_kaocwx.jpg" },
    {imageUrl:"https://res.cloudinary.com/dqk8dzdoo/image/upload/v1747905687/gal2_gfrjep.jpg" },

  ],
  rate: [
      {
        userId:"682e27ecf042a13bb628d1b9" ,
        rating: 3.3
      },
    ],
    rangeBooking: [
       {
      day: 0,
      start: 9 ,
      end: 12
    },
    {
      day: 1,
      start: 9,
      end: 15
    },
    {
      day:2,
      start: 10,
      end: 2
    },
    {
      day: 3,
      start: 10,
      end: 2
    },
    {
      day: 4,
      start: 10,
      end: 2
    },
    {
      day: 5,
      start: 10,
      end: 2
    },
     {
      day: 6,
      start: 10,
      end: 2
    }
  ]

  },
  {
    fullName: "hibaAllah Naeem",
    email: "hibaAllah@gmail.com",
    password: "hibaAllah123456",
    city: "Aliskandreh",
    region: "Domeat",
    address: "Altawra",
    phone: "+201271362456",
    specilizate: "جهاز هضمي و كبد",
    NumberState: 3,
        imageUrl:"https://res.cloudinary.com/dqk8dzdoo/image/upload/v1747665924/pharmacies/s576ijitsljid2h2twwf.jpg",
          Gallery:[
    {imageUrl:"https://res.cloudinary.com/dqk8dzdoo/image/upload/v1747905675/gall1_kaocwx.jpg" },
    {imageUrl:"https://res.cloudinary.com/dqk8dzdoo/image/upload/v1747905687/gal2_gfrjep.jpg" },

  ],
   rangeBooking: [
       {
      day: 0,
      start: 9 ,
      end: 12
    },
    {
      day: 1,
      start: 9,
      end: 15
    },
    {
      day:2,
      start: 10,
      end: 2
    },
    {
      day: 3,
      start: 10,
      end: 2
    },
    {
      day: 4,
      start: 10,
      end: 2
    },
    {
      day: 5,
      start: 10,
      end: 2
    },
     {
      day: 6,
      start: 10,
      end: 2
    }
  ]

  },
  {
    fullName: "Asaad asad",
    email: "Asaadssd@gmail.com",
    password: "Asaad123456",
    city: "Aliskandreh",
    region: "Domeat",
    address: "Altawra",
    phone: "+201275121009",
    specilizate: "نساء و توليد",
    NumberState: 3,
        imageUrl:"https://res.cloudinary.com/dqk8dzdoo/image/upload/v1747665924/pharmacies/s576ijitsljid2h2twwf.jpg",
          Gallery:[
    {imageUrl:"https://res.cloudinary.com/dqk8dzdoo/image/upload/v1747905675/gall1_kaocwx.jpg" },
    {imageUrl:"https://res.cloudinary.com/dqk8dzdoo/image/upload/v1747905687/gal2_gfrjep.jpg" },

  ],
  rangeBooking: [
       {
      day: 0,
      start: 9 ,
      end: 12
    },
    {
      day: 1,
      start: 9,
      end: 15
    },
    {
      day:2,
      start: 10,
      end: 2
    },
    {
      day: 3,
      start: 10,
      end: 2
    },
    {
      day: 4,
      start: 10,
      end: 2
    },
    {
      day: 5,
      start: 10,
      end: 2
    },
     {
      day: 6,
      start: 10,
      end: 2
    }
  ]

  },
  {
    fullName: "haidar jomaa",
    email: "Asaadaw@gmail.com",
    password: "Asaad123456",
    city: "Aliskandreh",
    region: "Domeat",
    address: "Altawra",
    phone: "+201275233909",
    specilizate: "نساء و توليد",
    NumberState: 3,
        imageUrl:"https://res.cloudinary.com/dqk8dzdoo/image/upload/v1747665924/pharmacies/s576ijitsljid2h2twwf.jpg",
          Gallery:[
    {imageUrl:"https://res.cloudinary.com/dqk8dzdoo/image/upload/v1747905675/gall1_kaocwx.jpg" },
    {imageUrl:"https://res.cloudinary.com/dqk8dzdoo/image/upload/v1747905687/gal2_gfrjep.jpg" },

  ],
   rangeBooking: [
       {
      day: 0,
      start: 9 ,
      end: 12
    },
    {
      day: 1,
      start: 9,
      end: 15
    },
    {
      day:2,
      start: 10,
      end: 2
    },
    {
      day: 3,
      start: 10,
      end: 2
    },
    {
      day: 4,
      start: 10,
      end: 2
    },
    {
      day: 5,
      start: 10,
      end: 2
    },
     {
      day: 6,
      start: 10,
      end: 2
    }
  ]

  },
];

async function seedDoctors() {
  try {
    await Doctor.deleteMany({});
    console.log('Old doctors deleted');

    await Doctor.insertMany(doctorsData);
    console.log('Seed data inserted');
  } catch (error) {
    console.error('Error seeding data:', error.message);
  }
}

module.exports = seedDoctors;
