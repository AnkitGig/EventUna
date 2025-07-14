const EventCategory = require("../models/event/EventCategory");
const EventType = require("../models/event/EventType");
const preferences = require("../utils/placePreference");
const notes = require("../utils/notes")
const EventPoll = require("../models/event/EventPoll");
const EventPollVote = require("../models/event/EventPollVote");
const Event = require("../models/event/Event");
const EventPreference = require("../models/event/EventPreference");
const User = require("../models/user/User");
const joi = require("joi");

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

exports.placePreferences = async (req, res) => {
  try {
    // Fetch all place preferences
    const placePreferences = preferences;

    res.status(200).json({
      status: true,
      message: "Place preferences fetched successfully",
      data: placePreferences,
    });
  } catch (error) {
    console.error("Error fetching place preferences:", error);
    res.status(500).json({ status: false, message: "Internal server error" });
  }
};

exports.eventNotes = async (req, res) => {
  try {
    // Fetch all event notes
    const eventNotes = notes;

    res.status(200).json({
      status: true,
      message: "Event notes fetched successfully",
      data: eventNotes,
    });
  } catch (error) {
    console.error("Error fetching event notes:", error);
    res.status(500).json({ status: false, message: "Internal server error" });
  }
}

exports.createEvent = async (req, res) => {
  const session = await Event.startSession();
  session.startTransaction();

  try {
    const {
      eventTitle,
      invitationMessage,
      eventType,
      eventCategory,
      eventDates,
      timeDuration,
      placePreference,
      placeDetail,
      poll,
    } = req.body;

    // ✅ Schema validation
    const schema = joi.object({
      eventTitle: joi.string().required(),
      invitationMessage: joi.string().allow(""),
      eventType: joi.string().required(),
      eventCategory: joi.string().required(),
      eventDates: joi.array().items(joi.date().iso()).min(1).required(),
      timeDuration: joi
        .object({
          startTime: joi.string().required(),
          endTime: joi.string().required(),
        })
        .required(),
      placePreference: joi
        .string()
        .valid(...Object.values(preferences))
        .required(),
      placeDetail: joi.object().required(),
      poll: joi
        .object({
          question: joi.string().required(),
          options: joi.array().items(joi.string().required()).min(2).required(),
          activeTill: joi.string().required(),
        })
        .optional(),
    });

    const { error } = schema.validate(req.body);
    if (error) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        status: false,
        message: error.details[0].message,
      });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ status: false, message: "User not found" });
    }

    // ✅ 1. Create Event
    const newEvent = new Event({
      userId: req.user.id,
      eventTitle,
      invitationMessage,
      eventType,
      eventCategory,
      eventDates,
      timeDuration,
    });

    await newEvent.save({ session });

    // ✅ 2. Save Place Preference + Detail
    const placeDoc = {
      eventId: newEvent._id,
      option: placePreference,
    };

    if (placePreference === "Private location") {
      placeDoc.address = placeDetail.address;
    } else if (placePreference === "Choose from map") {
      placeDoc.coordinates = {
        lat: placeDetail.lat,
        lng: placeDetail.lng,
        formattedAddress: placeDetail.formattedAddress,
      };
    } else if (placePreference === "Restaurant from list") {
      placeDoc.selectedRestaurants = placeDetail.restaurants; // array of { name, placeId, address }
    }

    await EventPreference.create([placeDoc], { session });

    // ✅ 3. Save Poll (optional)
    if (poll) {
      const newPoll = new EventPoll({
        eventId: newEvent._id,
        createdBy: req.user.id,
        question: poll.question,
        options: poll.options.map((opt) => ({
          optionText: opt,
          voteCount: 0,
        })),
        activeTill: poll.activeTill,
      });

      const savedPoll = await newPoll.save({ session });

      // attach poll ID to event
      newEvent.pollId = savedPoll._id;
      await newEvent.save({ session });
    }

    await session.commitTransaction();
    session.endSession();

    return res.status(201).json({
      status: true,
      message: "Event created successfully",
      data: {
        eventId: newEvent._id,
        pollId: newEvent.pollId || null,
      },
    });
  } catch (err) {
    console.error("Error creating event:", err);
    await session.abortTransaction();
    session.endSession();
    return res.status(500).json({
      status: false,
      message: "Internal server error",
    });
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
      .exec();

    const eventPreferences = await EventPreference.find({
      eventId: { $in: events.map((event) => event._id) },
    })
      .populate("eventId", "eventTitle")
      .exec();

    // Attach preferences to each event
    events.forEach((event) => {
      event.preferences = eventPreferences
        .filter((pref) => pref.eventId._id.toString() === event._id.toString())
        .map((pref) => pref.option);
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
