// "use client"

// import { useEffect, useState } from "react"
// import { useSearchParams } from "next/navigation"
// import Link from "next/link"
// import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
// import { Button } from "@/components/ui/button"
// import { ArrowLeft, Check } from "lucide-react"

// export default function InfoPage() {
//   const searchParams = useSearchParams()
//   const [firstName, setFirstName] = useState<string>("")
//   const [lastName, setLastName] = useState<string>("")
  
//   // Get information from URL parameters
//   useEffect(() => {
//     const firstNameParam = searchParams.get("firstName")
//     const lastNameParam = searchParams.get("lastName")
    
//     if (firstNameParam) setFirstName(firstNameParam)
//     if (lastNameParam) setLastName(lastNameParam)
//   }, [searchParams])
  
//   return (
//     <div className="flex min-h-screen flex-col items-center justify-center bg-white p-8">
//       <Card className="w-full max-w-md">
//         <CardHeader className="text-center">
//           <CardTitle className="text-2xl">User Information</CardTitle>
//           <CardDescription>Information collected from WebRTC conversation</CardDescription>
//         </CardHeader>
        
//         <CardContent className="space-y-6">
//           <div className="rounded-lg bg-green-100 p-4 text-center">
//             <div className="mb-4 flex justify-center">
//               <div className="rounded-full bg-green-500 p-2">
//                 <Check className="h-6 w-6 text-white" />
//               </div>
//             </div>
//             <p className="text-sm font-medium text-green-800">Information successfully collected!</p>
//           </div>
          
//           <div className="space-y-4">
//             <div className="rounded-md border p-4">
//               <p className="text-sm font-medium text-gray-500">First Name</p>
//               <p className="mt-1 text-lg font-semibold">{firstName || "Not provided"}</p>
//             </div>
            
//             <div className="rounded-md border p-4">
//               <p className="text-sm font-medium text-gray-500">Last Name</p>
//               <p className="mt-1 text-lg font-semibold">{lastName || "Not provided"}</p>
//             </div>
//           </div>
//         </CardContent>
        
//         <CardFooter>
//           <Link href="/test" className="w-full">
//             <Button variant="outline" className="w-full">
//               <ArrowLeft className="mr-2 h-4 w-4" />
//               Back to WebRTC Test
//             </Button>
//           </Link>
//         </CardFooter>
//       </Card>
//     </div>
//   )
// } 
import React from 'react'

function page() {
  return (
    <div>page</div>
  )
}

export default page