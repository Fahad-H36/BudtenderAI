// // Import necessary modules
// import { NextResponse } from "next/server";
// import path from "path";
// import fs from "fs";
// import { pipeline } from "stream";
// import { promisify } from "util";
// import { uploadAttachment } from "@/utils/actions";
// const pump = promisify(pipeline);

// // Define the POST handler for the file upload
//   export const POST = async (req: any) => {
//   try {
//     // Parse the incoming form data
//     const formData = await req.formData();

//     // Get the file from the form data
//     const file = formData.get("file");

//     // Check if a file is received
//     if (!file) {
//       // If no file is received, return a JSON response with an error and a 400 status code
//       return NextResponse.json(
//         { error: "No files received." },
//         { status: 400 }
//       );
//     }

//     // Ensure the /tmp directory exists before writing the file
//     const uploadDir = path.join("/tmp");
//     await ensureDirectoryExists(uploadDir);

//     // Generate a unique filename using Date.now() and append it to the original filename
//     const uniqueFilename = `${Date.now()}_${file.name}`;
//     const filePath = path.join(uploadDir, uniqueFilename);

//     // Write the file to the /tmp directory with the unique filename
//     await pump(file.stream(), fs.createWriteStream(filePath));

//     // Upload the file to OpenAI
//     const fileUploadedToOpenAI = await uploadAttachment(
//       fs.createReadStream(filePath)
//     );

//     // Delete the file after upload
//     await deleteFile(filePath);

//     // Return a JSON response with a success message and a 201 status code
//     return NextResponse.json({ file: fileUploadedToOpenAI });
//   } catch (error: any) {
//     // If an error occurs during file writing, log the error
//     console.log("Error occurred ", error);

//     // Return a JSON response with a failure message and a 500 status code
//     return NextResponse.json({ Message: "Failed", status: 500 });
//   }
// };

// // Function to ensure directory exists, creating it if necessary
// async function ensureDirectoryExists(dirPath: string) {
//   try {
//     await fs.promises.access(dirPath);
//   } catch (error) {
//     if (
//       error &&
//       typeof error === "object" &&
//       "code" in error &&
//       error.code === "ENOENT"
//     ) {
//       await fs.promises.mkdir(dirPath, { recursive: true });
//     } else {
//       throw error;
//     }
//   }
// }

// // Function to delete a file
// async function deleteFile(filePath: string) {
//   try {
//     await fs.promises.unlink(filePath);
//   } catch (error) {
//     console.log(`Error deleting file: ${filePath}`, error);
//     throw error; // Propagate the error if deletion fails
//   }
// }


// Import necessary modules
import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs";
import { uploadAttachment } from "@/utils/actions";


// Define the POST handler for the file upload
export const POST = async (req: NextRequest) => {
  try {
    // Parse the incoming form data
    const formData = await req.formData();

    // Get the file from the form data
    const file = formData.get("file");

    // Check if a file is received
    if (!file || !(file instanceof File)) {
      // If no file is received, return a JSON response with an error and a 400 status code
      return NextResponse.json(
        { error: "No files received or invalid file type." },
        { status: 400 }
      );
    }

    // Ensure the /tmp directory exists before writing the file
    const uploadDir = path.join("/tmp");
    await ensureDirectoryExists(uploadDir);

    // Generate a unique filename using Date.now() and append it to the original filename
    const uniqueFilename = `${Date.now()}_${file.name}`;
    const filePath = path.join(uploadDir, uniqueFilename);

    // Write the file to disk
    const bytes = await file.arrayBuffer();
    await fs.promises.writeFile(filePath, Buffer.from(bytes));

    // Upload the file to OpenAI
    const fileUploadedToOpenAI = await uploadAttachment(
      fs.createReadStream(filePath)
    );

    // Delete the file after upload
    await deleteFile(filePath);

    // Return a JSON response with a success message and a 201 status code
    return NextResponse.json({ file: fileUploadedToOpenAI });
  } catch (error) {
    // If an error occurs during file writing, log the error
    console.log("Error occurred ", error);

    // Return a JSON response with a failure message and a 500 status code
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : "An unknown error occurred", 
      status: 500 
    });
  }
};

// Function to ensure directory exists, creating it if necessary
async function ensureDirectoryExists(dirPath: string) {
  try {
    await fs.promises.access(dirPath);
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "ENOENT"
    ) {
      await fs.promises.mkdir(dirPath, { recursive: true });
    } else {
      throw error;
    }
  }
}

// Function to delete a file
async function deleteFile(filePath: string) {
  try {
    await fs.promises.unlink(filePath);
  } catch (error) {
    console.log(`Error deleting file: ${filePath}`, error);
    throw error; // Propagate the error if deletion fails
  }
}
