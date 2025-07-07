const Event = require('../models/Event')
const User = require("../models/User")
const EventCategory = require('../models/EventCategory')




exports.eventCategory = async(req, res)=>{
  try {
     
  } catch (error) {
    console.error("Error in eventCategory:", error);
    res.status(500).json({ message: "Internal server error" });
    
  }

}