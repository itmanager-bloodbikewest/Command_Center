// Shared data constants.

export const EMPTY_CALL = {
  timestamp:"", timeOfCall:"", dateOfCallFromHospital:"", controllerName:"",
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

export const REQUIRED_CALL_FIELDS = ["controllerName", "originHospital", "destinationHospital", "riders", "numPackages"];
