import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useUser } from "../context/UserContext";


function UpdateChat(props) {
  const [courseFile, setCourseFile] = useState(null);
  const [additionalFiles, setAdditionalFiles] = useState([]);
  const [piazzaFile, setPiazzaFile] = useState(null);
  const [uploadInProgress, setUploadInProgress] = useState(false);
  const {user, getCourse} = useUser();
  let course = getCourse();
  const [url, setURL] = useState("");

  const handleFileChange = (event) => {
    setCourseFile(event.target.files[0]);
    var files = Array.from(event.target.files);
    setAdditionalFiles(files.slice(1));
  };
  const handlePiazzaFileChange = (event) => {
    setPiazzaFile(event.target.files[0]);
  };
  const handleURLChange = (event) => {
    setURL(event.target.value);
  }
  
  useEffect(() => {
    console.log("Additional files uploaded:", additionalFiles);
  }, [additionalFiles]);

  const uploadContent = async (courseFile) => {
    if (!courseFile) return;
    toast("Uploading course content and creating RAG. Please wait...", { autoClose: false});

    setUploadInProgress(true);
    
    var formData = new FormData();

    formData.append("command", "createLlm");
    formData.append("user", user.userid);
    formData.append("courseid", course.course_id);
    formData.append('coursecontent', courseFile);

    fetch(props.uploadurl, {
      method: "POST",
      credentials: "include",
      body: formData
    })
      .then((response) => response.json())
      .then((data) => {
        console.log(data);
        toast.dismiss();
        if (data) {
          console.log("Course contents uploaded successfully!");
          toast.success("Course contents uploaded successfully!");
          props.uploadSuccess();
        } else {
          console.error("Error uploading the course contents");
          toast.error("Error uploading the course contents");
        }
        setUploadInProgress(false);
      })
      .catch((error) => {
        console.error("There was an error:", error);
        toast.error("There was an error uploading the course contents");
        setUploadInProgress(false);
      });
  };

  const uploadAdditionalContent = async () => {
    for (const file of additionalFiles) {
      await uploadContent(file);
    }
  };
  const uploadFirstFile = async () => {
    await uploadContent(courseFile);
    await uploadAdditionalContent();
  };
  
  const uploadPiazza = () => {
    if (!piazzaFile) return;
    toast("Uploading piazza data and creating RAG. Please wait...", { autoClose: false});

    setUploadInProgress(true);

    var formData = new FormData();

    formData.append("command", "uploadPiazza");
    //formData.append("command", "createLlmPiazza");
    formData.append("user", user.userid);
    formData.append("courseid", course.course_id);
    formData.append('piazzacontent', piazzaFile);

    fetch(props.uploadurl, {
      method: "POST",
      credentials: "include",
      body: formData
    })
      .then((response) => response.json())
      .then((data) => {
        console.log(data);
        toast.dismiss();
        if (data) {
          console.log("Piazza contents uploaded successfully!");
          toast.success("Piazza contents uploaded successfully!");
        } else {
          console.error("Error uploading the piazza contents");
          toast.error("Error uploading the piazza contents");
        }
        setUploadInProgress(false);
      })
      .catch((error) => {
        console.error("There was an error:", error);
        toast.error("There was an error uploading the piazza contents");
        setUploadInProgress(false);
      });

  };

  const generateFileNameFromURL = (url) => {
  try {
    const parsed_url = new URL(url);

    let filename = parsed_url.hostname + parsed_url.pathname;

    filename = filename
      .replace(/[^a-z0-9]/gi, "_")
      .replace(/_+/g, "_")
      .replace(/^_|_$/g, "");

    return filename || "scraped_content";
  } catch {
    return "scraped_content";
  }
};

  const uploadScrapedContent = (content) => {
    if (!content) return;
    toast("Uploading scraped content. Please wait...", { autoClose: false});
    
    setUploadInProgress(true);

    const formData = new FormData();

    formData.append("command", "createLlm");
    formData.append("user", user.userid);
    formData.append("courseid", course.course_id);
    
    const filename = generateFileNameFromURL(url) + ".txt";

    const file = new File([content], filename, {
      type: "text/plain",
    });

    formData.append("coursecontent", file);

    fetch(props.uploadurl, {
      method: "POST",
      credentials: "include",
      body: formData,
    })
      .then((response) => response.json())
      .then((data) => {
        toast.dismiss();
        if (data) {
          toast.success("Scraped content uploaded successfully!");
        } else {
          toast.error("Error uploading scraped content");
        }
        setUploadInProgress(false);
      })
      .catch((error) => {
        console.error(error);
        toast.error("Upload failed");
        setUploadInProgress(false);
      });
};

  const scrapeURL = async () => {
    if (!url) return;
    toast("Scraping URL. Please wait...", { autoClose: false});
    
    setUploadInProgress(true);
    
    var formData = new FormData();

    formData.append("command", "scrapeURL");
    formData.append('URL', url);

    fetch(props.uploadurl, {
      method: "POST",
      credentials: "include",
      body: formData
    })
      .then((response) => response.json())
      .then(async (data) => {
        console.log(data);
        toast.dismiss();
        
        if (data.content) {
          toast.success("URL scraped successfully! Now uploading...");
          await uploadScrapedContent(data.content);
        } else {
          console.error("Error scraping the URL");
          toast.error("Error scraping the URL");
        }
        setUploadInProgress(false);
      })
      .catch((error) => {
        console.error("There was an error:", error);
        toast.error("There was an error scraping the URL");
        setUploadInProgress(false);
      });
        
  };

  const scrapeURLDownload = async () => {
    if (!url) return;
    toast("Scraping URL. Please wait...", { autoClose: false});
    
    setUploadInProgress(true);
    
    var formData = new FormData();

    formData.append("command", "scrapeURL");
    formData.append('URL', url);

    fetch(props.uploadurl, {
      method: "POST",
      credentials: "include",
      body: formData
    })
      .then((response) => response.json())
      .then((data) => {
        console.log(data);
        toast.dismiss();
        
        if (data.content) {
          const blob = new Blob([data.content], { type: "text/plain" });
          const link = document.createElement("a");
          link.href = URL.createObjectURL(blob);
          const filename = generateFileNameFromURL(url) + ".txt";
          link.download = filename;
          link.click();

          console.log("URL scraped successfully!");
          toast.success("URL scraped successfully!");
        } else {
          console.error("Error scraping the URL");
          toast.error("Error scraping the URL");
        }
        setUploadInProgress(false);
      })
      .catch((error) => {
        console.error("There was an error:", error);
        toast.error("There was an error scraping the URL");
        setUploadInProgress(false);
      });
        
  };

  return (

    <div className="card mb-4">
        <h4 className="card-header">Upload Course Content</h4>
        <div className="card-body">
          <p>You may optionally upload course content to provide context to students using the LLM chatbot, so that they can get more tailored results based on your actual course content.</p>
          <form className="mb-3">
            <p className="form-label">Course Content</p>
            <div className="input-group mb-3"> 
            <input className="form-control" type="file" onChange={handleFileChange} accept=".zip,.pdf,.docx,.pptx,.png,.jpg,.txt" multiple/>
            <button type="button" disabled={uploadInProgress} className="btn btn-primary" onClick={uploadFirstFile}>Upload</button>
            </div>
            {/* <p className="form-text">This zip file should include any course content you would like the LLM to use when answering student questions.  Ideally, documents should be text, markdown, or PDF files.  Max upload size is 80MB.</p> */}
            <p className="form-text">Upload any course content you would like the LLM to use when answering student questions. Acceptable file types are .zip, .pdf, .docx, .pptx, .png, .jpg, and .txt files. Max upload size is 80MB.</p>
          </form>
          <form className="mb-3">
            <p className="form-label">Piazza Export ZIP</p>
            <div className="input-group mb-3"> 
            <input className="form-control" type="file" onChange={handlePiazzaFileChange} accept=".zip" />
            <button type="button" disabled={uploadInProgress} className="btn btn-primary" onClick={uploadPiazza}>Upload</button>
            </div>
            <p className="form-text">This zip file should be the exact file provided by Piazza when downloading all course content.  When requesting it from Piazza's statistics page, they will email you a link to this file.  We will ignore any posts with less than 10 views.  Max upload size is 80MB.</p>
          </form>
          <p>If you want to create a .txt file with all the text from a course webpage, you can use the tool below to scrape that text from the provided URL.</p>
          <p>Select "Upload" to automatically upload the txt file to the RAG chatbot after scraping. Select "Download" to download the txt file for review before manually uploading.</p>
          <form className="mb-3">
            <p className="form-label">Course Content TXT</p>
            <div className="input-group mb-3"> 
            <input className="form-control" type="url" value={url} placeholder="https://example.com" onChange={handleURLChange} />
            <button type="button" disabled={!url} className="btn btn-primary" onClick={scrapeURL}>Upload</button>
            <button type="button" disabled={!url} className="btn btn-primary" onClick={scrapeURLDownload}>Download</button>
            </div>
            <p className="form-text">Please use this tool responsibly and do not attempt to scrape the same URL repeatedly in quick succession.</p>
          </form>
      </div>
    </div>
  );
}

export default UpdateChat; 
