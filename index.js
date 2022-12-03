import {ApolloServer} from '@apollo/server';
import {startStandaloneServer} from '@apollo/server/standalone';

//Schema
const typeDefs = `#graphql
type Doctor {
    doctorId: ID!
    doctorName: String!
    clinicName: String!
    specialty: String!
    event: [Event]
}

type Event {
    eventId: ID!
    patientName: String!
    appointmentTime: String!
}

type Query {
    doctor(doctorId: ID!): Doctor
    event(doctorId: ID!): [Event]
}

type Mutation {
    createEvent(doctorId: ID!, eventId: ID!, patientName: String!, appointmentTime: String!): [Event]
    #deleteEvent(doctorId: ID!, eventId: ID!): [Event]
    deleteEvent(input: deleteInput!): [Event]
    updatePatientName(doctorId: ID!, eventId: ID!, newPatientName: String!): [Event]
}

input deleteInput {
    doctorId: ID!
    eventId: ID!
}
`;

//Define data set
const Doctor = [
    {
        doctorId: "1",
        doctorName: "Angela",
        clinicName: "CMU-clinic",
        specialty: "vaccine-department",
        event: [
            {
                eventId: "1",
                patientName: "Alex",
                appointmentTime: "9:30"
            },
            {
                eventId: "2",
                patientName: "Chang",
                appointmentTime: "15:30"
            }
        ]
    }
];

//Define resolver
const resolvers = {
    Query: {
        doctor: (parent, args, contextValue, info) => {
            //if in the doctors' list, we find the corresponding doctorId, return the related info
            if (Doctor.find(x => x.doctorId === args.doctorId) != null) {
                return Doctor.find(x => x.doctorId === args.doctorId);
            } else {
                //otherwise, return the error message implying the invalid ID for the given doctorId
                var errorCode = {
                    doctorId: "Invalid ID",
                    doctorName: "null",
                    clinicName: "null",
                    specialty: "null",
                }
                return errorCode;
            }
        },
        event: (parent, args, contextValue, info) => {
            if (Doctor.find(x => x.doctorId === args.doctorId) != null) {
                return Doctor.find(x => x.doctorId === args.doctorId).event;
            } else {
                var errorCode = {
                    eventId: "Invalid ID",
                    patientName: "null",
                    appointmentTime: "null"
                }
                return [errorCode];
            }
        },
    },
    Mutation: {
        createEvent: (parent, args, contextValue, info) => {
            //when creating a new event, check if the doctor exists
            if (Doctor.find(x => x.doctorId === args.doctorId) != null) {
                var doctor = Doctor.find(x => x.doctorId === args.doctorId)
                //check if we are creating an event carrying an existing eventId. If yes, return the corresponding error message
                if(doctor.event.find(y => y.eventId === args.eventId) != null) {
                    var errorCode = {
                        eventId: "Existing event",
                        patientName: "null",
                        appointmentTime: "null"
                    }
                    return [errorCode];
                } else if (doctor.event.find(y => y.appointmentTime === args.appointmentTime) != null) {
                    //or: check if the appointment time is available. If not, return error message implying this is not an available timeslot
                    var errorCode = {
                        eventId: "null",
                        patientName: "null",
                        appointmentTime: "Appointment full at that time"
                    }
                    return [errorCode];
                }

                //create the new event and push to the event list
                var newEvent = {
                    eventId: args.eventId,
                    patientName: args.patientName,
                    appointmentTime: args.appointmentTime
                }
                doctor.event.push(newEvent)

                //return the list of appointments for the specific doctor
                return Doctor.find(x => x.doctorId === args.doctorId).event;
            } else {
                var errorCode = {
                    eventId: "Invalid ID",
                    patientName: "null",
                    appointmentTime: "null"
                }
                return [errorCode];
            }
        },
        deleteEvent: (parent, args, contextValue, info) => {
            if (Doctor.find(x => x.doctorId === args.doctorId) != null) {
                var doctor = Doctor.find(x => x.doctorId === args.doctorId)
                //if trying to remove a non-existing event, return an error message
                if(doctor.event.find(y => y.eventId === args.eventId) == null) {
                    var errorCode = {
                        eventId: "Non-existing event",
                        patientName: "null",
                        appointmentTime: "null"
                    }
                    return [errorCode];
                }

                //remove the event from the appointments list of the doctor
                var eventToBeDeleted = doctor.event.find(y => y.eventId === args.eventId)
                doctor.event = arrayRemove(doctor.event, eventToBeDeleted);

                return Doctor.find(x => x.doctorId === args.doctorId).event;
            } else {
                var errorCode = {
                    eventId: "Invalid ID",
                    patientName: "null",
                    appointmentTime: "null"
                }
                return [errorCode];
            }
        },
        updatePatientName: (parent, args, contextValue, info) => {
            if (Doctor.find(x => x.doctorId === args.doctorId) != null) {
                var doctor = Doctor.find(x => x.doctorId === args.doctorId)
                if(doctor.event.find(y => y.eventId === args.eventId) == null) {
                    var errorCode = {
                        eventId: "Non-existing event",
                        patientName: "null",
                        appointmentTime: "null"
                    }
                    return [errorCode];
                }

                //create a new event with the updated patient name
                var newEvent = {
                    eventId: args.eventId,
                    patientName: args.newPatientName,
                    appointmentTime: doctor.event.find(y => y.eventId === args.eventId).appointmentTime
                }

                //remove the old event and add the new one to the appointments list
                var eventToBeDeleted = doctor.event.find(y => y.eventId === args.eventId)
                doctor.event = arrayRemove(doctor.event, eventToBeDeleted)
                doctor.event.push(newEvent)

                return Doctor.find(x => x.doctorId === args.doctorId).event;
            } else {
                var errorCode = {
                    eventId: "Invalid ID",
                    patientName: "null",
                    appointmentTime: "null"
                }
                return [errorCode];
            }
        }
    }
};

//helper function to iterate through a list and remove the target event
function arrayRemove(arr, value) {
    return arr.filter(function(ele){
        return ele != value;
    });
}

const server = new ApolloServer({
    typeDefs,
    resolvers,
});

//define the server to port 4567, as defined in part A2-1
const {url} = await startStandaloneServer(server, {
    listen: {port: 4567},
});

console.log(`🚀  Server ready at: ${url}`);