import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';

const test = async () => {
    try {
        const form = new FormData();
        form.append('secret', 'fbc7817b3878c3a823a06b8e687ae0618e9e0984');
        form.append('account', '17773656456364d3f0f495b6ab9dcf8d3b5c6e0b0169f0728d5dc8b');
        form.append('recipient', '919385500546'); // test number
        form.append('type', 'media');
        form.append('message', 'Test message with media');
        
        fs.writeFileSync('dummy.jpg', 'fake image content');
        form.append('media_file', fs.createReadStream('dummy.jpg')); 

        const response = await axios.post("https://wtservices.ackrock.com/api/send/whatsapp", form, {
            headers: form.getHeaders(),
        });
        console.log("Success:", response.data);
    } catch (error) {
        console.log("Error:", error.response?.data || error.message);
    }
}
test();
