import { Appbar } from "../components/Appbar";
import axios from "axios";
import { BACKEND_URL } from "../config";
import { useNavigate } from "react-router-dom";
import { ChangeEvent, useState } from "react";

export const Publish = () => {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [generatedArticle, setGeneratedArticle] = useState(""); // State to store generated article
    const navigate = useNavigate();

    const generateArticle = async () => {
        try {
            const token = localStorage.getItem('token');
            // console.log(token);
            if (!token) {
                // Handle case when token is not available (user is not logged in)
                console.error("User is not logged in.");
                return;
            }
            const response = await axios.post(
                `${BACKEND_URL}/api/v1/blog/getResponse`,
                { userPrompt: title },
                {
                    headers: {
                        Authorization: localStorage.getItem("token")
                    }
                }
            );
            // console.log(response);
            setGeneratedArticle(response.data.final_response); // Update state with generated article
        } catch (error) {
            console.error("Error generating article:", error);
        }
    };



    return (
        <div>
            <Appbar />
            <div className="flex justify-center w-full pt-8">
                <div className="max-w-screen-lg w-full">
                    <input
                        onChange={(e) => setTitle(e.target.value)}
                        type="text"
                        className="w-full bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                        placeholder="Title"
                    />
                    <TextEditor onChange={(e) => setDescription(e.target.value)} />
                    <button
                        onClick={generateArticle} // Call generateArticle function on button click
                        type="button"
                        className="mt-4 inline-flex items-center px-5 py-2.5 text-sm font-medium text-center text-white bg-blue-700 rounded-lg focus:ring-4 focus:ring-blue-200 dark:focus:ring-blue-900 hover:bg-blue-800 mr-4"
                    >
                        Generate an Article
                    </button>
                    <button
                        onClick={async () => {
                            // Your existing code to publish post
                            const response = await axios.post(`${BACKEND_URL}/api/v1/blog`, {
                                title,
                                content: description
                            }, {
                                headers: {
                                    Authorization: localStorage.getItem("token")
                                }
                            });
                            navigate(`/blog/${response.data.id}`);

                        }}
                        type="submit"
                        className="mt-4 inline-flex items-center px-5 py-2.5 text-sm font-medium text-center text-white bg-blue-700 rounded-lg focus:ring-4 focus:ring-blue-200 dark:focus:ring-blue-900 hover:bg-blue-800 mr-4"
                    >
                        Publish post
                    </button>
                </div>
            </div>
            {generatedArticle && ( // Display generated article if available
                <div className="mt-8">
                    <h2 className="text-lg font-bold mb-2">Generated Article</h2>
                    <div className="border border-gray-300 p-4">{generatedArticle}</div>
                </div>
            )}
        </div>
    );
};

function TextEditor({ onChange }: { onChange: (e: ChangeEvent<HTMLTextAreaElement>) => void }) {
    return (
        <div className="mt-2">
            <div className="w-full mb-4">
                <div className="flex items-center justify-between border">
                    <div className="my-2 bg-white rounded-b-lg w-full">
                        <label className="sr-only">Publish post</label>
                        <textarea
                            onChange={onChange}
                            id="editor"
                            rows={8}
                            className="focus:outline-none block w-full px-0 text-sm text-gray-800 bg-white border-0 pl-2"
                            placeholder="Write an article..."
                            required
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
