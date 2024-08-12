<div align="center">

# LabelLLM: The Open-Source Data Annotation Platform
    
<article style="display: flex; flex-direction: column; align-items: center; justify-content: center;">
 <p align="center"><img width="300" alt="LOGO(1)" src="https://github.com/opendatalab/LabelLLM/assets/154008929/86cf7026-c0d6-4cad-8be5-82ae541f9813"></p>
</a>
  <a href="https://www.youtube.com/@OpenDataLab" target="_blank">
    <img alt="YouTube" src="https://img.shields.io/badge/YouTube-black?logo=youtube&logoColor=red" />
  </a>
  <a href="https://space.bilibili.com/1081749692" target="_blank">
    <img alt="BiliBili" src="https://img.shields.io/badge/BiliBili-pink?logo=bilibili&logoColor=white" />
  </a>

<h1 style="width: 100%; text-align: center;"></h1>
    <p align="center">
        English | <a href="https://github.com/opendatalab/LabelLLM/wiki/README%E2%80%90zh" >简体中文</a>
    </p>
</article>

</div>

## Product Introduction
LabelLLM introduces an innovative, open-source platform dedicated to optimizing the data annotation process integral to the development of LLM. Engineered with a vision to be a powerful tool for independent developers and small to medium-sized research teams to improve annotation efficiency. At its core, LabelLLM commits to facilitating the data annatation processes of model training with simplicity and efficiency by providing comprehensive task management solutions and versatile multimodal data support.
## Key Features

**Flexible Configuration** 

LabelLLM is distinguished by its adaptable framework, offering an array of task-specific tools that are customizable to meet the diverse needs of data annotation projects. This flexibility allows for seamless integration into a variety of task parameters, making it an invaluable asset in the preparation of data for model training.

**Multimodal Data Support**  

Recognizing the importance of diversity in data, LabelLLM extends its capabilities to encompass a wide range of data modalities, including audio, images, and video. This holistic approach ensures that users can undertake complex annotation projects involving multiple types of data, under a single unified platform.

**Comprehensive Task Management**  

Ensuring the highest standards of quality and efficiency, LabelLLM features an all-encompassing task management system. This system offers real-time monitoring of annotation progress and quality control, thereby guaranteeing the integrity and timeliness of the data preparation phase for all projects.

**Artificial Intelligence Assisted Annotation**  

LabelLLM supports pre-annotation loading, which can be refined and adjusted by users according to actual needs. This feature improves the efficiency and accuracy of annotation.

https://github.com/user-attachments/assets/1acb2096-38dc-4225-8aa5-bdb616862679

## Product Characteristics
**Versatility** 

With LabelLLM, users gain access to an extensive suite of data annotation tools, designed to cater to a wide array of task without compromising on the efficacy or precision of annotations.

**User-Friendly** 

Beyond its robust capabilities, LabelLLM places a strong emphasis on user experience, offering intuitive configurations and workflow processes that streamline the setup and distribution of data annotation tasks. 

**Efficiency Enhanced** 

By incorporating AI-assisted annotations, LabelLLM dramatically increases annotation efficiency. 

## Getting Strated

-  <a href="https://github.com/opendatalab/LabelLLM/wiki/User-Manual%E2%80%90Operation-Side">
    <button>User Manual-Operation Side</button>
</a>

-  <a href="https://github.com/opendatalab/LabelLLM/wiki/User-Mannual%E2%80%90Labeler">
    <button>User Mannual-Labeler</button>
</a>

- <a href="https://github.com/opendatalab/LabelLLM/wiki/%E5%B8%B8%E8%A7%81%E9%97%AE%E9%A2%98">  <button>FAQ </button></a>

## Video Tutorial

Click on the image below to watch the video:

<div align="center">
  <a href="https://www.youtube.com/watch?v=YObHzZWwDdw">
    <img src="https://img.youtube.com/vi/YObHzZWwDdw/maxresdefault.jpg" alt="Watch the video" width="600" />
  </a>
</div>


<div align="center">
  <a href="https://www.youtube.com/watch?v=Hp2eprDcWEA&t=2s">
    <img src="https://img.youtube.com/vi/Hp2eprDcWEA/maxresdefault.jpg" alt="Watch the video" width="600" />
  </a>
</div>


## Local Deployment

> Deployment Tutorial Video:  https://www.youtube.com/watch?v=KXofJzCOafk

1. Clone the project locally or download the project code zip.

    > Recommended to run on Linux, if you encounter problems with the installation you can refer to  <a href="https://github.com/opendatalab/LabelLLM/wiki/%E5%B8%B8%E8%A7%81%E9%97%AE%E9%A2%98">  <button>FAQ </button></a>

2. Install Docker, select the corresponding operating system type and download and install it, then **start the Docker service**.

    > Docker installation tutorial: https://docs.docker.com/get-docker/

3. Under the file address of the corresponding project, run the command:

    ```
    docker compose up
    ```
    > Note: The initial installation may take some time, so please be patient and make sure you have a good internet connection.  
    > If you are in china, you can use the following command to speed up the download:
    > ```json
    > // /etc/docker/daemon.json
    > {
    >   "registry-mirrors": [
    >     "https://docker.m.daocloud.io"
    >   ]
    > }
    > ```
    > Read more: https://github.com/DaoCloud/public-image-mirror?tab=readme-ov-file#%E6%9C%80%E4%BD%B3%E5%AE%9E%E8%B7%B5

4. Open a browser and access Localhost:9001.
    > username: user password: password

5. Modify the Access key to:

    ```
    MINIO_ACCESS_KEY_ID = MekKrisWUnFFtsEk
    MINIO_ACCESS_KEY_SECRET = XK4uxD1czzYFJCRTcM70jVrchccBdy6C
    ```

6. Open your browser and visit the following address to access it:

    http://localhost:8086/supplier Labeling

    http://localhost:8086/operator admin

    > Replace localhost with the corresponding ip address to share it with other team members so that they can use it directly without repeated deployment.
    
    <mark>**The first registered account will be set as administrator by default, and subsequent accounts need to be set to get the operation side of the account privileges, please do not forget the first registered account and password!**</mark>

# Citation

```bibtex
@article{he2024opendatalab,
  title={Opendatalab: Empowering general artificial intelligence with open datasets},
  author={He, Conghui and Li, Wei and Jin, Zhenjiang and Xu, Chao and Wang, Bin and Lin, Dahua},
  journal={arXiv preprint arXiv:2407.13773},
  year={2024}
}
```

## Technical Communication

Welcome to join Opendatalab official weibo group!

<p align="center">
<img style="width: 200px" src="https://user-images.githubusercontent.com/25022954/208374419-2dffb701-321a-4091-944d-5d913de79a15.jpg" </p>


## Links
- [LabelU](https://github.com/opendatalab/labelU) (another multimodal labeling artifact from Opendatalab)
- [MinerU](https://github.com/opendatalab/MinerU) (One-stop high quality data extraction tool)


## Configuration details

Backend Documentation [Configuration File](backend/README.md)

Frontend Documentation [Configuration File](frontend/README.md)


