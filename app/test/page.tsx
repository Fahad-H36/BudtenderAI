// /*
// "use client"

// import { useState, useEffect } from "react"
// import { useRouter } from "next/navigation"
// import useWebRTCAudioSession from "@/hooks/use-webrtc"
// import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
// import { Button } from "@/components/ui/button"
// import { Mic, MicOff, Send } from "lucide-react"
// import { TranslationsProvider } from "@/components/translations-context"

// // Create a simple Badge component since the UI component isn't available
// const Badge = ({ children, variant }: { children: React.ReactNode, variant: string }) => {
//   const bgColor = variant === "success" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800";
//   return (
//     <span className={`px-2 py-1 rounded-md text-xs font-medium ${bgColor}`}>
//       {children}
//     </span>
//   );
// };

// // Create a simple Input component since the UI component isn't available
// const Input = ({ 
//   placeholder, 
//   value, 
//   onChange, 
//   onKeyDown, 
//   disabled, 
//   className 
// }: { 
//   placeholder?: string;
//   value: string;
//   onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
//   onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
//   disabled?: boolean;
//   className?: string;
// }) => {
//   return (
//     <input
//       type="text"
//       placeholder={placeholder}
//       value={value}
//       onChange={onChange}
//       onKeyDown={onKeyDown}
//       disabled={disabled}
//       className={`px-3 py-2 border rounded-md ${className}`}
//     />
//   );
// };

// // Define our custom tools for name collection
// const nameToolDefinitions = [
//   {
//     type: "function",
//     name: "storeFirstName",
//     description: "Stores the user's first name",
//     parameters: {
//       type: "object",
//       properties: {
//         firstName: {
//           type: "string",
//           description: "User's first name to store"
//         }
//       },
//       required: ["firstName"]
//     }
//   },
//   {
//     type: "function",
//     name: "storeLastName",
//     description: "Stores the user's last name and prepares for redirection",
//     parameters: {
//       type: "object",
//       properties: {
//         lastName: {
//           type: "string",
//           description: "User's last name to store"
//         }
//       },
//       required: ["lastName"]
//     }
//   },
//   {
//     type: "function",
//     name: "completeAndRedirect",
//     description: "Completes the information collection process and redirects to the info page",
//     parameters: {
//       type: "object",
//       properties: {}
//     }
//   }
// ];   
// function TestPageContent() {
//   const router = useRouter()
//   const [textMessage, setTextMessage] = useState("")
//   const [selectedVoice, setSelectedVoice] = useState("alloy")
//   const [firstName, setFirstName] = useState("")
//   const [lastName, setLastName] = useState("")
//   const [processingNameInfo, setProcessingNameInfo] = useState(false)
//   const [redirecting, setRedirecting] = useState(false)
//   const [functionCallsDebug, setFunctionCallsDebug] = useState<string[]>([])
  
//   // Define tool functions here
//   const storeFirstNameFunction = ({ firstName }: { firstName: string }) => {
//     console.log("storeFirstName called with:", firstName);
//     setFunctionCallsDebug(prev => [...prev, `storeFirstName called with: ${firstName}`]);
    
//     if (firstName) {
//       setFirstName(firstName);
//       return { 
//         success: true, 
//         message: `First name '${firstName}' has been stored successfully.` 
//       };
//     }
    
//     return { 
//       success: false, 
//       message: "No first name provided." 
//     };
//   };
  
//   const storeLastNameFunction = ({ lastName }: { lastName: string }) => {
//     console.log("storeLastName called with:", lastName);
//     setFunctionCallsDebug(prev => [...prev, `storeLastName called with: ${lastName}`]);
    
//     if (lastName) {
//       setLastName(lastName);
//       setProcessingNameInfo(true);
      
//       // Schedule the redirect
//       setTimeout(() => {
//         setRedirecting(true);
//         endSessionAndRedirect();
//       }, 3000);
      
//       return { 
//         success: true, 
//         message: `Last name '${lastName}' has been stored successfully. Redirecting to info page.` 
//       };
//     }
    
//     return { 
//       success: false, 
//       message: "No last name provided." 
//     };
//   };
  
//   const completeAndRedirectFunction = () => {
//     console.log("completeAndRedirect called");
//     setFunctionCallsDebug(prev => [...prev, `completeAndRedirect called`]);
    
//     if (firstName && lastName) {
//       setProcessingNameInfo(true);
//       setRedirecting(true);
      
//       setTimeout(() => {
//         endSessionAndRedirect();
//       }, 1000);
      
//       return { 
//         success: true, 
//         message: "Completing process and redirecting to info page." 
//       };
//     }
    
//     return { 
//       success: false, 
//       message: "Cannot redirect: missing first name or last name." 
//     };
//   };
  
//   // Initialize WebRTC session with tools
//   const {
//     status,
//     isSessionActive,
//     audioIndicatorRef,
    
//     stopSession,
//     handleStartStopClick,
//     conversation,
//     currentVolume,
//     sendTextMessage,
//     registerFunction
//   } = useWebRTCAudioSession(selectedVoice, nameToolDefinitions)

//   // Function to manually end session and redirect
//   const endSessionAndRedirect = () => {
//     console.log("Ending session and redirecting...");
    
//     if (isSessionActive) {
//       stopSession();
//     }
    
//     // Add a small delay before redirecting
//     setTimeout(() => {
//       router.push(`/info?firstName=${encodeURIComponent(firstName || "Guest")}&lastName=${encodeURIComponent(lastName || "User")}`);
//     }, 1000);
//   };

//   // Register our functions for the AI to call
//   useEffect(() => {
//     if (!registerFunction) return;
    
//     console.log("Registering AI functions...");
    
//     // Register all our functions
//     registerFunction("storeFirstName", storeFirstNameFunction);
//     registerFunction("storeLastName", storeLastNameFunction);
//     registerFunction("completeAndRedirect", completeAndRedirectFunction);
    
//   }, [registerFunction]);

//   // Handle session start - send initial instructions to AI
//   useEffect(() => {
//     if (isSessionActive && conversation.length === 0) {
//       console.log("Sending initial instructions to AI...");
      
//       // Initial instructions for the AI when session starts
//       setTimeout(() => {
//         sendTextMessage(
//           "You are a helpful assistant. Your task is to collect the user's first and last name in a conversational way. " +
//           "First, ask for their first name. When they provide it, call the storeFirstName function with their first name as the parameter. " +
//           "Then, ask for their last name. When they provide it, call the storeLastName function with their last name as the parameter. " +
//           "If at any point the user expresses they want to finish or complete the process, call the completeAndRedirect function. " +
//           "Be friendly and conversational throughout this process. Start by greeting the user and asking for their first name."
//         );
//       }, 1000);
//     }
//   }, [isSessionActive, conversation.length, sendTextMessage]);

//   const handleSendMessage = () => {
//     if (textMessage.trim()) {
//       sendTextMessage(textMessage)
//       setTextMessage("")
//     }
//   }

//   const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
//     if (e.key === "Enter" && !e.shiftKey) {
//       e.preventDefault()
//       handleSendMessage()
//     }
//   }

//   return (
//     <div className="flex min-h-screen flex-col bg-white">
//       <div className="flex-1 p-8">
//         <h1 className="text-3xl font-bold mb-8">WebRTC Test Page</h1>
        
//         <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
//           {/* Controls Panel */}
//           <Card>
//             <CardHeader>
//               <CardTitle>WebRTC Controls</CardTitle>
//               <CardDescription>Test the real-time audio communication</CardDescription>
//             </CardHeader>
//             <CardContent className="space-y-4">
//               <div className="flex items-center gap-4">
//                 <div className="flex-1">
//                   <p className="text-sm font-medium mb-2">Voice Selection</p>
//                   <select 
//                     className="w-full p-2 border rounded-md"
//                     value={selectedVoice}
//                     onChange={(e) => setSelectedVoice(e.target.value)}
//                     disabled={isSessionActive}
//                   >
//                     <option value="alloy">Alloy</option>
//                     <option value="echo">Echo</option>
//                     <option value="fable">Fable</option>
//                     <option value="onyx">Onyx</option>
//                     <option value="nova">Nova</option>
//                     <option value="shimmer">Shimmer</option>
//                   </select>
//                 </div>
                
//                 <div className="flex-1">
//                   <p className="text-sm font-medium mb-2">Connection Status</p>
//                   <Badge variant={status === "connected" ? "success" : "secondary"}>
//                     {status || "Not connected"}
//                   </Badge>
//                 </div>
//               </div>
              
//               <div>
//                 <p className="text-sm font-medium mb-2">Audio Level Indicator</p>
//                 <div 
//                   className="w-full h-8 bg-gray-200 rounded-md overflow-hidden"
//                 >
//                   <div 
//                     ref={(el) => {
//                       if (audioIndicatorRef.current !== el) {
//                         // @ts-expect-error - we're manually setting the ref 
//                         audioIndicatorRef.current = el;
//                       }
//                     }}
//                     className="h-full bg-teal transition-all duration-75"
//                     style={{ width: `${Math.min(currentVolume * 100, 100)}%` }}
//                   />
//                 </div>
//               </div>

//               {processingNameInfo && (
//                 <div className="mt-4 p-3 bg-yellow-100 rounded-md">
//                   <p className="text-sm font-medium">Processing your information...</p>
//                   <p className="text-xs mt-1">You'll be redirected in a moment.</p>
//                 </div>
//               )}
              
//               {(firstName || lastName) && (
//                 <div className="mt-4 p-3 bg-blue-50 rounded-md">
//                   <p className="text-sm font-medium">Collected Information:</p>
//                   {firstName && (
//                     <p className="text-xs mt-1">First Name: <span className="font-medium">{firstName}</span></p>
//                   )}
//                   {lastName && (
//                     <p className="text-xs mt-1">Last Name: <span className="font-medium">{lastName}</span></p>
//                   )}
//                 </div>
//               )}
              
//               {firstName && lastName && !processingNameInfo && (
//                 <div className="mt-4">
//                   <Button 
//                     onClick={() => {
//                       sendTextMessage("I'd like to complete the process now.")
//                     }}
//                     className="w-full bg-green-500 hover:bg-green-600"
//                   >
//                     Complete & View Information
//                   </Button>
//                 </div>
//               )}
              
//               {functionCallsDebug.length > 0 && (
//                 <div className="mt-4 p-3 bg-gray-100 rounded-md overflow-auto max-h-32">
//                   <p className="text-sm font-medium mb-1">Function Calls Debug:</p>
//                   {functionCallsDebug.map((call, i) => (
//                     <p key={i} className="text-xs text-gray-700">{call}</p>
//                   ))}
//                 </div>
//               )}
//             </CardContent>
//             <CardFooter>
//               <Button 
//                 onClick={handleStartStopClick}
//                 className={isSessionActive ? "bg-red-500 hover:bg-red-600" : "bg-teal hover:bg-teal/90"}
//                 disabled={processingNameInfo || redirecting}
//               >
//                 {isSessionActive ? (
//                   <>
//                     <MicOff className="mr-2 h-4 w-4" />
//                     Stop Session
//                   </>
//                 ) : (
//                   <>
//                     <Mic className="mr-2 h-4 w-4" />
//                     Start Session
//                   </>
//                 )}
//               </Button>
//             </CardFooter>
//           </Card>

//           {/* Chat Panel */}
//           <Card className="flex flex-col">
//             <CardHeader>
//               <CardTitle>Conversation</CardTitle>
//               <CardDescription>The assistant will ask for your first and last name</CardDescription>
//             </CardHeader>
//             <CardContent className="flex-1 overflow-y-auto max-h-[400px]">
//               <div className="space-y-4">
//                 {conversation.map((message) => (
//                   <div 
//                     key={message.id} 
//                     className={`p-3 rounded-lg ${
//                       message.role === "user" 
//                         ? "bg-gray-100 ml-auto max-w-[80%]" 
//                         : "bg-teal/10 mr-auto max-w-[80%]"
//                     }`}
//                   >
//                     <p className="text-sm font-medium mb-1">
//                       {message.role === "user" ? "You" : "Assistant"}
//                       {message.status === "speaking" && " (speaking...)"}
//                       {message.status === "processing" && " (processing...)"}
//                     </p>
//                     <p>{message.text || "..."}</p>
//                   </div>
//                 ))}
//                 {!conversation.length && (
//                   <p className="text-center text-gray-500 py-10">
//                     Start a session to begin the conversation
//                   </p>
//                 )}
//               </div>
//             </CardContent>
//             <CardFooter>
//               <div className="flex w-full gap-2">
//                 <Input
//                   placeholder="Type a message..."
//                   value={textMessage}
//                   onChange={(e) => setTextMessage(e.target.value)}
//                   onKeyDown={handleKeyDown}
//                   disabled={!isSessionActive || processingNameInfo || redirecting}
//                   className="flex-1"
//                 />
//                 <Button 
//                   onClick={handleSendMessage}
//                   disabled={!isSessionActive || !textMessage.trim() || processingNameInfo || redirecting}
//                 >
//                   <Send className="h-4 w-4" />
//                 </Button>
//               </div>
//             </CardFooter>
//           </Card>
//         </div>

//         <div className="mt-8">
//           <Card>
//             <CardHeader>
//               <CardTitle>Instructions</CardTitle>
//             </CardHeader>
//             <CardContent className="space-y-4">
//               <div>
//                 <h3 className="font-bold">What to expect:</h3>
//                 <ol className="list-decimal pl-5 space-y-2 mt-2">
//                   <li>Click "Start Session" to begin</li>
//                   <li>The assistant will ask for your first name</li>
//                   <li>Provide your first name (speak or type)</li>
//                   <li>The assistant will ask for your last name</li>
//                   <li>Provide your last name (speak or type)</li>
//                   <li>After providing both names, you'll be redirected to a page displaying your information</li>
//                   <li>OR say "complete the process" at any time to finish early</li>
//                 </ol>
//               </div>
//             </CardContent>
//           </Card>
//         </div>
//       </div>
//     </div>
//   )
// }

// // Wrap the component with TranslationsProvider to fix the useTranslations error
// export default function TestPage() {
//   return (
//     <TranslationsProvider>
//       <TestPageContent />
//     </TranslationsProvider>
//   )
// } 

import React from 'react'

export default function page() {
  return (
    <div>
      <h1>Test Page</h1>
    </div>
  )
}
