const fs = require("fs")
const csv = require("fast-csv");


const stream = fs.createReadStream("input.csv")

let isHeader = true

let fullname, eid, invisible, see_all;
const emails = []
const phones = []
const groups = []

const finalJson = []


stream.pipe(csv.parse())
    .on("error", err => console.log(err))
    .on("data", row => {
        if (isHeader) {
            for (let i = 0; i < row.length; i++) {
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
            }

            isHeader = false
        } else {

            const allGroups = []

            groups.forEach((group) => {

                let separatedGroup = row[group].replace(",", "/").split("/")

                let formattedGroup = separatedGroup.map((group) => {
                    return group.trim()
                })

                formattedGroup = formattedGroup.filter((group) => {
                    return group != ""
                })

                allGroups.push(...formattedGroup)
            })


            const addresses = []

            emails.forEach((email) => {
                let separatedEmail = row[email.i].replace(",", "/").split("/")


                separatedEmail.forEach((eachEmail) => {
                    let formattedEmail = eachEmail.replace(/\(/g, "").replace(/\)/g, "").replace(/,/g, "").replace(/:/g, "").replace(/;/g, "").trim()


                    if (validateEmail(formattedEmail)) {
                        let address = {
                            type: "email",
                            tags: email.tags,
                            address: formattedEmail
                        }
                        addresses.push(address)
                    }
                })
            })

            phones.forEach((phone) => {

                let formattedPhone = row[phone.i].replace(/\(/g, "").replace(/\)/g, "").replace(/\-/g, "").replace(/\ /g, "")


                if (formattedPhone.length > 10 && !isNaN(formattedPhone)) {

                    if (formattedPhone.length < 12) {
                        formattedPhone = "55" + formattedPhone
                    }

                    let address = {
                        type: "phone",
                        tags: phone.tags,
                        address: formattedPhone
                    }
                    addresses.push(address)
                }
            })

            row[invisible] = checkInvisibleAndSeeAllFields(row[invisible])

            row[see_all] = checkInvisibleAndSeeAllFields(row[see_all])

            let isSameId = false

            finalJson.forEach((element) => {
                if (element.eid.indexOf(row[eid]) != -1) {
                    isSameId = true
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

            if (!isSameId) {
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

