const radiology = require('../model/radiology.model');

const radiologydata = [
    {
    fullName:"Arwa",
    email:"Arwa@gmail.com",
    password:"Arwa123456",
    city:"Aliskandreh",
    region:"Domeat",
    address:"Althawra",
    phone:"+201438892309",
    StartJob:"09:40 AM",
    EndJob:"6:30 PM",
    rate: [
      {
        userId:"682e27ecf042a13bb628d1b9" ,
        rating: 3.6
      },
    ]
},
{
    fullName:"Alaa",
    email:"Alaa@gmail.com",
    password:"Alaa123456",
    city:"Aliskandreh",
    region:"Domeat",
    address:"Althawra",
    phone:"+201433232786",
    StartJob:"08:30 AM",
    EndJob:"4:30 PM",
    rate: [
      {
        userId:"682e27ecf042a13bb628d1b9" ,
        rating: 2.4
      },
    ]
},
{
    fullName:"Jamel",
    email:"Jamel@gmail.com",
    password:"Jamel123456",
    city:"Aliskandreh",
    region:"Domeat",
    address:"Althawra",
    phone:"+201438891235",
    StartJob:"09:00 AM",
    EndJob:"9:30 PM",
    rate: [
      {
        userId:"682e27ecf042a13bb628d1b9" ,
        rating: 5
      },
    ]
},
{
    fullName:"Hanan",
    email:"Hanan@gmail.com",
    password:"Hanan123456",
    city:"Aliskandreh",
    region:"Domeat",
    address:"Althawra",
    phone:"+201438812439",
    StartJob:"09:40 AM",
    EndJob:"6:30 PM",
    rate: [
      {
        userId:"682e27ecf042a13bb628d1b9" ,
        rating: 1.3
      },
    ]
},
{
    fullName:"AlKhalil",
    email:"AlKhalil@gmail.com",
    password:"AlKhalil123456",
    city:"Aliskandreh",
    region:"Domeat",
    address:"Althawra",
    phone:"+201438890931",
    StartJob:"09:40 AM",
    EndJob:"6:30 PM",
    rate: [
      {
        userId:"682e27ecf042a13bb628d1b9" ,
        rating: 3.3
      },
    ]
}
]

async function seedRadiologies() {
  try {
    await radiology.deleteMany({});
    console.log('Old doctors deleted');

    await radiology.insertMany(radiologydata);
    console.log('Seed data inserted');
  } catch (error) {
    console.error('Error seeding data:', error.message);
  }
}

module.exports = seedRadiologies;