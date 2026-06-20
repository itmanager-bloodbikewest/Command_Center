// Shared data constants.

export const EMPTY_CALL = {
  timestamp:"", timeOfCall:"", dateOfCallFromHospital:"", controllerName:"", controllerPhone:"",
  transportDate:"", dateCallReceived:"",
  originHospital:"", destinationHospital:"",
  itemsTransported:[], numPackages:"", riders:[], riderDutyStatus:"",
  greenLights:false, meetOtherGroup:[], vehicleUsed:"", riderCalled:"", notes:"",
  contactName:"", contactPhone:"", pickupAddress:"", dropOffAddress:"",
  scheduledMeetupDate:"", scheduledMeetupTime:"",
  pickupTime:"", meetupTime:"", deliveryTime:"", riderHome:"", completedAt:"",
  overrides:{}, status:"pending-pickup", id:"",
};

export const STATUS = {
  "pending-pickup": { label:"Pending Pickup",    colorKey:"orange" },
  "in-transit":     { label:"In Transit",        colorKey:"accent" },
  "delivered":      { label:"Delivered",         colorKey:"green" },
  "complete":       { label:"Transport Complete", colorKey:"purple" },
};

// Required to OPEN a call (the asterisked fields). numPackages additionally
// must be >= 1 (validated separately — see submitCall).
export const REQUIRED_CALL_FIELDS = ["controllerName", "timeOfCall", "transportDate", "originHospital", "destinationHospital", "riders", "numPackages"];

// Required to mark a call COMPLETE (non-asterisked but enforced at completion).
export const COMPLETE_REQUIRED_FIELDS = ["vehicleUsed"];

// Friendly labels for warning messages.
export const FIELD_LABELS = {
  controllerName: "Controller",
  timeOfCall: "Time of call",
  transportDate: "Transport date",
  originHospital: "Origin",
  destinationHospital: "Destination",
  riders: "Rider",
  numPackages: "Number of packages",
  vehicleUsed: "Vehicle",
};
