const User = require(`../models/user/User`)
const Services = require(`../models/merchant/Services`)
const joi = require("joi");

//    "email": "admin@yopmail.com",
//   "mobile": "admin@420",

exports.addServices= async(req,res)=>{
 try {
    const { servicesName } = req.body;

    // Validate input
    const schema = joi.object({
        servicesName: joi.string().required().messages({
            "string.empty": "Service name is required",
            "any.required": "Service name is required"
        })
    })

    const { error } = schema.validate({ servicesName });
    if (error) {
        return res.status(400).json({ message: error.details[0].message });
    }


    // Create new service
    const newService = new Services({
        servicesName,
    });

    // Save service to database
    await newService.save();

    res.status(201).json({ message: "Service added successfully", service: newService });
    
 } catch (error) {
    console.error("Error adding services:", error);
    res.status(500).json({ message: "Internal server error" });
 }
}


