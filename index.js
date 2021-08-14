const fs = require("fs")
const csv = require("fast-csv");


const stream = fs.createReadStream("input.csv")

let header = true

let fullname, eid, invisible, see_all;
const emails = []
const phones = []
const groups = []

const finalJson = []


stream.pipe(csv.parse())
    .on("error", err => console.log(err))
    .on("data", row => {
        if (header) {
            for (let i = 0; i < row.length; i++)
                if (row[i] == "fullname") {
                    fullname = i
                } else if (row[i] == "eid") {
                    eid = i
                } else if (row[i] == "invisible") {
                    invisible = i
                } else if (row[i] == "see_all") {
                    see_all = i
                } else if (row[i].search("email") != -1) {

                    tags = row[i].split(" ")
                    tags.shift()
                    let email = { i, tags }

                    emails.push(email)

                } else if (row[i].search("phone") != -1) {

                    tags = row[i].split(" ")
                    tags.shift()
                    let phone = { i, tags }

                    phones.push(phone)

                } else if (row[i].search("group") != -1) {
                    groups.push(i)
                }
            // console.log(fullname, eid, emails, phones, groups, invisible, see_all)

            header = false
        } else {

            const allGroups = []

            groups.forEach((group) => {

                let separetedGroup = row[group].replace(",", "/").split("/")

                let formatedGroup = separetedGroup.map((group) => {
                    return group.trim()
                })

                formatedGroup = formatedGroup.filter((group) => {
                    return group != ""
                })

                allGroups.push(...formatedGroup)
            })


            const addresses = []

            emails.forEach((email) => {
                let separetedEmail = row[email.i].replace(",", "/").split("/")


                separetedEmail.forEach((eachEmail) => {
                    let formatedEmail = eachEmail.replace(/\(/g, "").replace(/\)/g, "").replace(/,/g, "").replace(/:/g, "").replace(/;/g, "").trim()


                    if (validateEmail(formatedEmail)) {
                        let address = {
                            type: "email",
                            tags: email.tags,
                            address: formatedEmail
                        }
                        addresses.push(address)
                    }
                })
            })

            phones.forEach((phone) => {

                let formatedPhone = row[phone.i].replace("(", "").replace(")", "").replace("-", "").replace(" ", "")


                if (formatedPhone.length > 10 && !isNaN(formatedPhone)) {

                    if (formatedPhone.length < 12) {
                        formatedPhone = "55" + formatedPhone
                    }

                    let address = {
                        type: "phone",
                        tags: phone.tags,
                        address: formatedPhone
                    }
                    addresses.push(address)
                }
            })

            row[invisible] = checkInvisibleAndSeeAllFields(row[invisible])

            row[see_all] = checkInvisibleAndSeeAllFields(row[see_all])

            let sameId = false

            finalJson.forEach((element) => {
                if (element.eid.indexOf(row[eid]) != -1) {
                    sameId = true
                    element.fullname = row[fullname]

                    allGroups.forEach((group) => {
                        if (element.groups.indexOf(group) == -1) {
                            element.groups.push(group)
                        }
                    })

                    element.addresses.push(...addresses)
                    element.invisible = row[invisible]
                    element.see_all = row[see_all]
                }
            })

            if (!sameId) {
                finalJson.push({
                    fullname: row[fullname],
                    eid: row[eid],
                    groups: allGroups,
                    addresses: addresses,
                    invisible: row[invisible],
                    see_all: row[see_all]
                })
            }
        }
    })
    .on("end", () => {
        console.log(finalJson)
        fs.writeFile("output.json", JSON.stringify(finalJson), (err) => {
            if (err) {
                console.log(err)
            }
        })
    })



function checkInvisibleAndSeeAllFields(data) {
    if (data == 1 || data == "yes") {
        return true
    } else {
        return false
    }
}

function validateEmail(email) {
    const re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(email);
}

