# LabelLLM: The Open-Source Data Annotation Platform
（English| <a href="https://github.com/opendatalab/LabelLLM/wiki/README%E2%80%90zh">
    <button>中文版</button>
</a>）
## Product Introduction
LabelLLM introduces an innovative, open-source platform dedicated to optimizing the data annotation process integral to the development of LLM. Engineered with a vision to be a powerful tool for independent developers and small to medium-sized research teams to improve annotation efficiency. At its core, LabelLLM commits to facilitating the data annatation processes of model training with simplicity and efficiency by providing comprehensive task management solutions and versatile multimodal data support.
## Key Features

**Flexible Configuration:** 

LabelLLM is distinguished by its adaptable framework, offering an array of task-specific tools that are customizable to meet the diverse needs of data annotation projects. This flexibility allows for seamless integration into a variety of task parameters, making it an invaluable asset in the preparation of data for model training.

**Multimodal Data Support:**  

Recognizing the importance of diversity in data, LabelLLM extends its capabilities to encompass a wide range of data modalities, including audio, images, and video. This holistic approach ensures that users can undertake complex annotation projects involving multiple types of data, under a single unified platform.

**Comprehensive Task Management:**  

Ensuring the highest standards of quality and efficiency, LabelLLM features an all-encompassing task management system. This system offers real-time monitoring of annotation progress and quality control, thereby guaranteeing the integrity and timeliness of the data preparation phase for all projects.

**Artificial Intelligence Assisted Annotation:**  

LabelLLM supports pre-annotation loading, which can be refined and adjusted by users according to actual needs. This feature improves the efficiency and accuracy of annotation.

## Product Characteristics
**Versatility:** 

With LabelLLM, users gain access to an extensive suite of data annotation tools, designed to cater to a wide array of task without compromising on the efficacy or precision of annotations.

**User-Friendly:** 

Beyond its robust capabilities, LabelLLM places a strong emphasis on user experience, offering intuitive configurations and workflow processes that streamline the setup and distribution of data annotation tasks. 

**Efficiency Enhanced:** 

By incorporating AI-assisted annotations, LabelLLM dramatically increases annotation efficiency. 

# Getting Strated

-  <a href="https://github.com/opendatalab/LabelLLM/wiki/User-Manual%E2%80%90Operation-Side">
    <button>User Manual-Operation Side</button>
</a>

-  <a href="https://github.com/opendatalab/LabelLLM/wiki/User-Mannual%E2%80%90Labeler-Auditor">
    <button>User Mannual-Labeler/Auditor</button>
</a>


# Local Deployment

1. Clone the project locally or download the project code zip.

2. Install Docker, select the corresponding operating system type and download and install it.

3. Under the file address of the corresponding project, run the command:

```
docker compose up
```
> Note: The initial installation may take some time, so please be patient and make sure you have a good internet connection.

4. Open a browser and access Localhost:9001.
> username: user password: password

5. Modify the Access key to:
MINIO_ACCESS_KEY_ID = MekKrisWUnFFtsEk
MINIO_ACCESS_KEY_SECRET = XK4uxD1czzYFJCRTcM70jVrchccBdy6C

6. Open your browser and visit the following address to access it:

    http://localhost:8086/supplier Labeling

    http://localhost:8086/operator admin

> Replace localhost with the corresponding ip address to share it with other team members so that they can use it directly without repeated deployment.

# Technical Communication

Welcome to join Opendatalab official weibo group!

<p align="center">
<img style="width: 400px" src="https://user-images.githubusercontent.com/25022954/208374419-2dffb701-321a-4091-944d-5d913de79a15.jpg" </p>


# Links
- [LabelU](https://github.com/opendatalab/labelU) (another multimodal labeling artifact from Opendatalab)

Translated with www.DeepL.com/Translator (free version)

# Configuration details

Backend Documentation [Configuration File](backend/README.md)

Frontend Documentation [Configuration File](frontend/README.md)


