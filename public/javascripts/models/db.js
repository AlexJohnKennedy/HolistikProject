const faker = require('faker');

let randomName = faker.name.findName(); // Rowan Nikolaus
let randomEmail = faker.internet.email(); // Kassandra.Haley@erich.biz
let randomCard = faker.helpers.createCard(); // random contact card containing many properties

let users = [];

for (let i=0; i<100; i++) {
    let obj = {
        firstName : faker.name.firstName(),
        lastName : faker.name.lastName(),
        id : i
    }
    users.push(obj);
}

module.exports = {
    users
};