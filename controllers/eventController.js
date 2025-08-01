const EventCategory = require("../models/event/EventCategory");
const EventType = require("../models/event/EventType");
const preferences = require("../utils/placePreference");
const EventNotes = require("../models/event/EventNotes");
const EventPoll = require("../models/event/EventPoll");
const EventPollVote = require("../models/event/EventPollVote");
const EventRegistry = require("../models/event/EventRegistry");
const Event = require("../models/event/Event");
const EventPreference = require("../models/event/EventPreference");
const Notification = require("../models/notifications/Notification");
const EventPreferences = require("../models/event/EventPreferences");
const {
  sendPushNotification,
  saveNotifications,
} = require("../services/firbase/notifications");
const { parseJsonArray } = require("../utils/helpers");
// const EventAddtionalServices = require("../models/event/EventAdditionalServices");
const User = require("../models/user/User");
const joi = require("joi");
const EventAdditionalServices = require("../models/event/EventAdditionalServices");

exports.addEventCategory = async (req, res) => {
  try {
    const { category, eventType } = req.body;
    const schema = joi.object({
      category: joi.string().required(),
      eventType: joi.string().required(),
    });
    const { error } = schema.validate(req.body);
    if (error)
      return res
        .status(400)
        .json({ status: false, message: error.details[0].message });

    // Check if the event type exists
    const existingEventType = await EventType.findById(eventType);
    if (!existingEventType) {
      return res.status(404).json({ message: "Event Type not found" });
    }

    // Create new event category
    const newEventCategory = new EventCategory({
      category,
      eventType,
    });

    // Save the new event category to the database
    await newEventCategory.save();

    res.status(201).json({
      message: "Event Category added successfully",
      data: newEventCategory,
    });
  } catch (error) {
    console.error("Error adding event category:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.addEventType = async (req, res) => {
  try {
    const { eventType } = req.body;
    const schema = joi.object({
      eventType: joi.string().required(),
    });
    const { error } = schema.validate(req.body);
    if (error)
      return res
        .status(400)
        .json({ status: false, message: error.details[0].message });

    // Check if the event type already exists
    const existingEventType = await EventType.findOne({
      eventType: eventType,
    });

    if (existingEventType) {
      return res.status(400).json({ message: "Event Type already exists" });
    }

    // Create new event type
    const newEventType = new EventType({
      eventType,
    });
    // Save the new event type to the database
    await newEventType.save();
    res.status(201).json({
      message: "Event Type added successfully",
      data: newEventType,
    });
  } catch (error) {
    console.error("Error adding event type:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// exports.allEventType = async (req, res) => {
//   try {
//     const eventTypes = await EventType.find().populate("EventCategory", "category").exec();
//     res.status(200).json({
//       status: true,
//       message: "Event Types fetched successfully",
//       data: eventTypes,
//     });
//   } catch (error) {
//     console.error("Error fetching event types:", error);
//     res.status(500).json({ status: false, message: "Internal server error" });
//   }
// };

exports.allEventType = async (req, res) => {
  try {
    const eventTypes = await EventType.aggregate([
      {
        $lookup: {
          from: "eventcategories", // MongoDB collection name
          let: { typeId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$eventType", "$$typeId"] },
              },
            },
            {
              $project: {
                _id: 1,
                category: 1,
              },
            },
          ],
          as: "categories",
        },
      },
    ]);

    res.status(200).json({
      status: true,
      message: "Event Types with categories fetched successfully",
      data: eventTypes,
    });
  } catch (error) {
    console.error("Error fetching event types with categories:", error);
    res.status(500).json({ status: false, message: "Internal server error" });
  }
};

exports.categoryByEventType = async (req, res) => {
  try {
    const { id } = req.params;
    const schema = joi.object({
      id: joi.string().required(),
    });
    const { error } = schema.validate(req.params);
    if (error)
      return res
        .status(400)
        .json({ status: false, message: error.details[0].message });

    // Fetch categories by event type
    const categories = await EventCategory.find({ eventType: id })
      .populate("eventType", "eventType")
      .exec();

    if (!categories.length) {
      return res
        .status(404)
        .json({ message: "No categories found for this event type" });
    }

    res.status(200).json({
      status: true,
      message: "Categories fetched successfully",
      data: categories,
    });
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({ status: false, message: "Internal server error" });
  }
};

// exports.placePreferences = async (req, res) => {
//   try {
//     // Fetch all place preferences
//     const placePreferences = preferences;

//     res.status(200).json({
//       status: true,
//       message: "Place preferences fetched successfully",
//       data: placePreferences,
//     });
//   } catch (error) {
//     console.error("Error fetching place preferences:", error);
//     res.status(500).json({ status: false, message: "Internal server error" });
//   }
// };

exports.eventNotes = async (req, res) => {
  try {
    const notes = await EventNotes.find().select("notes").exec();
    if (!notes || notes.length === 0) {
      return res.status(404).json({ status: false, message: "No notes found" });
    }
    res.status(200).json({
      status: true,
      message: "Event notes fetched successfully",
      data: notes,
    });
  } catch (error) {
    console.error("Error fetching event notes:", error);
    res.status(500).json({ status: false, message: "Internal server error" });
  }
};

// exports.createEvent = async (req, res) => {
//   const session = await Event.startSession();
//   session.startTransaction();

//   try {
//     const {
//       eventTitle,
//       invitationMessage,
//       eventType,
//       eventCategory,
//       eventDates,
//       timeDuration,
//       placePreference,
//       placeDetail,
//       poll,
//     } = req.body;

//     // ✅ Schema validation
//     const schema = joi.object({
//       eventTitle: joi.string().required(),
//       invitationMessage: joi.string().allow(""),
//       eventType: joi.string().required(),
//       eventCategory: joi.string().required(),
//       eventDates: joi.array().items(joi.date().iso()).min(1).required(),
//       timeDuration: joi
//         .object({
//           startTime: joi.string().required(),
//           endTime: joi.string().required(),
//         })
//         .required(),
//       placePreference: joi
//         .string()
//         .valid(...Object.values(preferences))
//         .required(),
//       placeDetail: joi.object().required(),
//       poll: joi
//         .object({
//           question: joi.string().required(),
//           options: joi.array().items(joi.string().required()).min(2).required(),
//           activeTill: joi.string().required(),
//         })
//         .optional(),
//     });

//     const { error } = schema.validate(req.body);
//     if (error) {
//       await session.abortTransaction();
//       session.endSession();
//       return res.status(400).json({
//         status: false,
//         message: error.details[0].message,
//       });
//     }

//     const user = await User.findById(req.user.id);
//     if (!user) {
//       await session.abortTransaction();
//       session.endSession();
//       return res.status(404).json({ status: false, message: "User not found" });
//     }

//     // ✅ 1. Create Event
//     const newEvent = new Event({
//       userId: req.user.id,
//       eventTitle,
//       invitationMessage,
//       eventType,
//       eventCategory,
//       eventDates,
//       timeDuration,
//     });

//     await newEvent.save({ session });

//     // ✅ 2. Save Place Preference + Detail
//     const placeDoc = {
//       eventId: newEvent._id,
//       option: placePreference,
//     };

//     if (placePreference === "Private location") {
//       placeDoc.address = placeDetail.address;
//     } else if (placePreference === "Choose from map") {
//       placeDoc.coordinates = {
//         lat: placeDetail.lat,
//         lng: placeDetail.lng,
//         formattedAddress: placeDetail.formattedAddress,
//       };
//     } else if (placePreference === "Restaurant from list") {
//       placeDoc.selectedRestaurants = placeDetail.restaurants; // array of { name, placeId, address }
//     }

//     await EventPreference.create([placeDoc], { session });

//     // ✅ 3. Save Poll (optional)
//     if (poll) {
//       const newPoll = new EventPoll({
//         eventId: newEvent._id,
//         createdBy: req.user.id,
//         question: poll.question,
//         options: poll.options.map((opt) => ({
//           optionText: opt,
//           voteCount: 0,
//         })),
//         activeTill: poll.activeTill,
//       });

//       const savedPoll = await newPoll.save({ session });

//       // attach poll ID to event
//       newEvent.pollId = savedPoll._id;
//       await newEvent.save({ session });
//     }

//     await session.commitTransaction();
//     session.endSession();

//     return res.status(201).json({
//       status: true,
//       message: "Event created successfully",
//       data: {
//         eventId: newEvent._id,
//         pollId: newEvent.pollId || null,
//       },
//     });
//   } catch (err) {
//     console.error("Error creating event:", err);
//     await session.abortTransaction();
//     session.endSession();
//     return res.status(500).json({
//       status: false,
//       message: "Internal server error",
//     });
//   }
// };

exports.createEvent = async (req, res) => {
  console.log("Creating event...");
  const session = await Event.startSession();
  session.startTransaction();

  try {
    // ✅ Utility to safely parse JSON arrays from form-data
    // const parseJsonArray = (field) => {
    //   if (!req.body[field]) return [];
    //   return typeof req.body[field] === "string" ? JSON.parse(req.body[field]) : req.body[field];
    // };

    const contactListIds = parseJsonArray("contactListIds", req);
    const noteIds = parseJsonArray("noteIds", req);
    const additionalServiceIds = parseJsonArray("additionalServiceIds", req);

    const {
      eventTitle,
      eventDescription,
      eventTypeId,
      eventCategoryId,
      eventDate,
      eventStartTime,
      eventEndTime,
      placeId,
      addressId,
      bringalongGuest,
      bringalongGuestNumber,
      rvsp,
      rvspDateBy,
      amazonGiftUrlId,
      pollId,
    } = req.body;

    // // ✅ Validation Schema
    const schema = joi.object({
      eventTitle: joi.string().required(),
      eventDescription: joi.string().required(),
      eventTypeId: joi.string().required(),
      eventCategoryId: joi.string().required(),
      eventDate: joi.string().required(),
      eventStartTime: joi.string().required(),
      eventEndTime: joi.string().required(),
      placeId: joi.string().required(),
      addressId: joi.string().required(),
      contactListIds: joi.array().items(joi.string().required()).min(1).required(),
      noteIds: joi.array().items(joi.string().required()).min(1).required(),
      additionalServiceIds: joi.array().items(joi.string().required()).min(1).required(),
      bringalongGuest: joi.string().valid("Yes", "No").required(),
      bringalongGuestNumber: joi.string().allow(""),
      rvsp: joi.string().valid("Yes", "No").required(),
      rvspDateBy: joi.string().allow(""),
      amazonGiftUrlId: joi.string().allow(""),
      pollId: joi.string().allow(""),
    });

    const { error } = schema.validate({
      eventTitle,
      eventDescription,
      eventTypeId,
      eventCategoryId,
      eventDate,
      eventStartTime,
      eventEndTime,
      placeId,
      addressId,
      contactListIds,
      noteIds,
      additionalServiceIds,
      bringalongGuest,
      bringalongGuestNumber,
      rvsp,
      rvspDateBy,
      amazonGiftUrlId,
      pollId,
    });

    if (error) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ status: false, message: error.details[0].message });
    }

    // // ✅ Create new Event Document
    const newEvent = new Event({
      userId: req.user.id,
      eventTitle,
      description: eventDescription,
      eventType: eventTypeId,
      eventCategory: eventCategoryId,
      eventDate,
      eventStartDate: eventStartTime,
      eventEndDate: eventEndTime,
      placeId,
      addressId,
      contactList: contactListIds,
      bringaLongGuest: bringalongGuest,
      bringaLongNumber: bringalongGuestNumber,
      rvsp,
      rvspDate: rvspDateBy,
      noteId: noteIds,
      registryUrl: amazonGiftUrlId || null,
      additionalServices: additionalServiceIds,
      pollId: pollId || null,
      image: req.file ? req.file.filename : null,
    });

    await newEvent.save({ session });

    const contacts = await User.find({
      _id: { $in: contactListIds },
      ios_register_id: { $ne: null },
    }).select("ios_register_id fullName");

    await Promise.all(
      contacts.map((contact) =>
        sendPushNotification(
          contact.ios_register_id,
          "You're Invited!",
          `${req.user.fullName || "A friend"} invited you to: ${eventTitle}`,
          // { eventId: "6878f530361a8679edfbd25c" }
          { eventId: newEvent._id.toString() }
        )
      )
    );

    await saveNotifications(
      req.user.id,
      "You're Invited!",
      `${req.user.fullName || "A friend"} invited you to: ${eventTitle}`,
      { eventId: "6878f530361a8679edfbd25c" }
    );

    // await session.commitTransaction();
    // session.endSession();

    return res.status(201).json({
      status: true,
      message: "Event created successfully",
      data: "{ eventId: newEvent._id }",
    });
  } catch (err) {
    console.error("Error creating event:", err);
    // await session.abortTransaction();
    // session.endSession();
    return res
      .status(500)
      .json({ status: false, message: "Internal server error" });
  }
};

exports.getEvents = async (req, res) => {
  try {
    const events = await Event.find()
      .populate("eventType", "eventType")
      .populate("eventCategory", "category")
      .populate("pollId", "question options activeTill")
      .populate("placeId")
      .populate("addressId")
      .populate("noteId")
      .populate("registryUrl")
      .populate("additionalServices")
      .populate("contactList", "fullName email")
      .exec();

    events.map((item) => {
      item.image = item.image
        ? `${process.env.BASE_URL}/event/${item.image}`
        : `${process.env.DEFAULT_EVENT_PIC}`;
    });

    res.status(200).json({
      status: true,
      message: "Events fetched successfully",
      data: events,
    });
  } catch (error) {
    console.error("Error fetching events:", error);
    res.status(500).json({ status: false, message: "Internal server error" });
  }
};

// Get event by ID
exports.getEventById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res
        .status(400)
        .json({ status: false, message: "Event ID is required" });
    }
    const event = await Event.findById(id)
      .populate("eventType", "eventType")
      .populate("eventCategory", "category")
      .populate("pollId", "question options activeTill")
      .populate("placeId")
      .populate("addressId")
      .populate("noteId")
      .populate("registryUrl")
      .populate("additionalServices")
      .populate("contactList", "fullName email")
      .exec();
    if (!event) {
      return res
        .status(404)
        .json({ status: false, message: "Event not found" });
    }

    event.image = event.image
      ? `${process.env.BASE_URL}/event/${event.image}`
      : `${process.env.DEFAULT_EVENT_PIC}`;
    res.status(200).json({
      status: true,
      message: "Event fetched successfully",
      data: event,
    });
  } catch (error) {
    console.error("Error fetching event by ID:", error);
    res.status(500).json({ status: false, message: "Internal server error" });
  }
};

exports.eventByUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user)
      return res.status(404).json({ status: false, message: "User not found" });

    const events = await Event.find({ userId: user._id })
      .populate("eventType", "eventType")
      .populate("eventCategory", "category")
      .populate("pollId", "question options activeTill")
      .populate("placeId")
      .populate("addressId")
      .populate("noteId")
      .populate("registryUrl")
      .populate("additionalServices")
      .populate("contactList", "fullName email") // assuming contactList contains userIds
      .exec();

    events.map((item) => {
      item.image = item.image
        ? `${process.env.BASE_URL}/event/${item.image}`
        : `${process.env.DEFAULT_EVENT_PIC}`;
    });

    res.status(200).json({
      status: true,
      message: "Events fetched successfully",
      data: events,
    });
  } catch (error) {
    console.error("Error fetching events by user:", error);
    res.status(500).json({ status: false, message: "Internal server error" });
  }
};

exports.createPoll = async (req, res) => {
  try {
    const { question, options, activeTill } = req.body;

    const schema = joi.object({
      question: joi.string().required(),
      options: joi.array().items(joi.string().required()).min(2).required(),
      activeTill: joi.stringrequired(),
    });

    const { error } = schema.validate(req.body);
    if (error)
      return res
        .status(400)
        .json({ status: false, message: error.details[0].message });

    const newPoll = new EventPoll({
      createdBy: req.user.id,
      question,
      options: options.map((opt) => ({ optionText: opt })),
      activeTill,
    });

    const savedPoll = await newPoll.save();

    res
      .status(201)
      .json({ status: true, message: "Poll created", data: savedPoll });
  } catch (err) {
    console.error("Error creating poll:", err);
    res.status(500).json({ status: false, message: "Internal server error" });
  }
};

exports.voteOrUnvotePoll = async (req, res) => {
  try {
    const { pollId, optionId, action } = req.body;
    const userId = req.user.id;
    const user = await User.findById(req.user.id);

    if (!user) {
      return res
        .status(404)
        .json({ status: false, message: "User not found." });
    }

    if (!pollId || !optionId || !["vote", "unvote"].includes(action)) {
      return res.status(400).json({
        status: false,
        message:
          "pollId, optionId, and valid action ('vote' or 'unvote') are required.",
      });
    }

    const poll = await EventPoll.findById(pollId);
    if (!poll) {
      return res
        .status(404)
        .json({ status: false, message: "Poll not found." });
    }

    if (poll.activeTill < new Date()) {
      return res
        .status(400)
        .json({ status: false, message: "Poll has expired." });
    }

    const optionIndex = poll.options.findIndex(
      (opt) => opt._id.toString() === optionId
    );

    console.log("Option Index:", optionIndex);

    if (optionIndex === -1) {
      return res
        .status(400)
        .json({ status: false, message: "Invalid option ID." });
    }

    const existingVote = await EventPollVote.findOne({ pollId, userId });

    // 🗳 VOTE
    if (action === "vote") {
      if (existingVote) {
        return res
          .status(400)
          .json({ status: false, message: "You have already voted." });
      }

      poll.options[optionIndex].voteCount += 1;
      await poll.save();

      await EventPollVote.create({ pollId, userId, optionId });

      return res.status(200).json({
        status: true,
        message: "Vote submitted successfully.",
      });
    }

    // ❌ UNVOTE
    if (action === "unvote") {
      if (!existingVote) {
        return res
          .status(400)
          .json({ status: false, message: "You haven't voted yet." });
      }

      if (existingVote.optionId.toString() !== optionId) {
        return res.status(400).json({
          status: false,
          message: "You did not vote for this option.",
        });
      }

      poll.options[optionIndex].voteCount = Math.max(
        0,
        poll.options[optionIndex].voteCount - 1
      );
      await poll.save();

      await EventPollVote.deleteOne({ _id: existingVote._id });

      return res.status(200).json({
        status: true,
        message: "Vote removed successfully.",
      });
    }
  } catch (error) {
    console.error("Poll vote error:", error);
    res.status(500).json({ status: false, message: "Internal server error." });
  }
};

exports.createRegistry = async (req, res) => {
  try {
    const { registryName, registryUrtl } = req.body;
    const userId = req.user.id;

    // Validate input
    const schema = joi.object({
      registryName: joi.string().required(),
      registryUrtl: joi.string().required(),
    });
    const { error } = schema.validate(req.body);
    if (error) {
      return res
        .status(400)
        .json({ status: false, message: error.details[0].message });
    }

    // Create new registry
    const newRegistry = new EventRegistry({
      registryName,
      registryUrtl,
      userId,
    });

    await newRegistry.save();

    res.status(201).json({
      status: true,
      message: "Registry created successfully",
      data: newRegistry,
    });
  } catch (error) {
    console.error("Error creating registry:", error);
    res.status(500).json({ status: false, message: "Internal server error" });
  }
};

exports.registryByUser = async (req, res) => {
  try {
    const userId = req.user.id;
    const registries = await EventRegistry.find({ userId })
      .select("registryName registryUrtl")
      .exec();
    if (!registries || registries.length === 0) {
      return res
        .status(404)
        .json({ status: false, message: "No registries found for this user" });
    }
    res.status(200).json({
      status: true,
      message: "Registries fetched successfully",
      data: registries,
    });
  } catch (error) {
    console.error("Error fetching registries by user:", error);
    res.status(500).json({ status: false, message: "Internal server error" });
  }
};

exports.searchRegistry = async (req, res) => {
  try {
    const { query } = req.query;
    const userId = req.user.id;

    if (!query || query.trim() === "") {
      return res
        .status(400)
        .json({ status: false, message: "Query parameter is required" });
    }

    const registries = await EventRegistry.find({
      userId: userId, // ✅ Filter by logged-in user
      registryName: { $regex: query, $options: "i" },
    })
      .select("registryName registryUrtl createdAt")
      .exec();

    if (!registries || registries.length === 0) {
      return res.status(404).json({
        status: false,
        message: "No registries found matching the query",
      });
    }

    res.status(200).json({
      status: true,
      message: "Registries fetched successfully",
      data: registries,
    });
  } catch (error) {
    console.error("Error searching registries:", error);
    res.status(500).json({ status: false, message: "Internal server error" });
  }
};

exports.additionalServices = async (req, res) => {
  try {
    const services = await EventAdditionalServices.find()
      .select("serviceName")
      .exec();
    if (!services || services.length === 0) {
      return res.status(404).json({ status: false, message: "No notes found" });
    }

    res.status(200).json({
      status: true,
      message: "Event additional services fetched successfully",
      data: services,
    });
  } catch (error) {
    console.error("Error while getting additional services", error);
    res.status(500).json({ status: false, message: "Internal server error" });
  }
};

exports.placePreferences = async (req, res) => {
  try {
    const preference = await EventPreferences.find()
      .select("preferences")
      .exec();
    if (!preference || preference.length === 0) {
      return res
        .status(404)
        .json({ status: false, message: "No prefetences found" });
    }

    res.status(200).json({
      status: true,
      message: "Event place preferences fetched successfully",
      data: preference,
    });
  } catch (error) {
    console.error("Error while getting place preference", error);
    res.status(500).json({ status: false, message: "Internal server error" });
  }
};
