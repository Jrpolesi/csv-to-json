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
                    let email = {
                        index: i,
                        tags: "tag"
                    }
                    emails.push(email)
                } else if (row[i].search("phone") != -1) {
                    let phone = {
                        index: i,
                        tags: "tag"
                    }
                    phones.push(phone)
                } else if (row[i].search("group") != -1) {
                    groups.push(i)
                }
            // console.log(fullname, eid, emails, phones, groups, invisible, see_all)

            header = false
        } else {

            phones.forEach((phone)=>{
                console.log(row[phone])
            })

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



            row[invisible] = checkInvisibleAndSeeAllFields(row[invisible])
            row[see_all] = checkInvisibleAndSeeAllFields(row[see_all])

            finalJson.push({
                fullname: row[fullname],
                eid: row[eid],
                groups: allGroups,
                // addresses: addresses,
                invisible: row[invisible],
                see_all: row[see_all]
            })
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