
# HYBrid
It's pretty fucking cool
## Installation
There are three different nodes in the system. The **server, RPi gateway**, and **mobile application.** Each one of these components lives on a different device and, therefore, must be installed differently. The first step for all nodes is the same; start by cloning the repository:
```
git clone https://github.com/Aranyak-Ghosh/IP_finalsprint.git
``` 
This project requires NodeJS and npm. To install them, please follow the link https://nodejs.org/en/download/

### RPi Gateway
The RPi Gateway is responsible for adding rooms to the grid of the app overall. To add an RPi Gateway, clone the files as shown above into an empty directory inside an RPi.

 1.  on a terminal navigate to the directory of the repo and run the following.
 ```
cd RPi/
npm install
```

2. Open the file ```estimote.js``` using any text editor and make changes as per your room configuration. The variables at the beginning of the file are what will determine the beacon's positions, the room size, room number, MQTT topic, etc.

3. Once you made the changes required, run the gateway code by running the following command:
```
sudo node estimote.js
```
### Server 
This node is responsible for handling the RPi context data, as well as contain the middleware of the system, and of course serve clients with data and processed requests.
> Note: the server must run on a Linux/OSX machine to satisfy the dependency of the on memory database 'redis'.

After cloning the repository, make sure there is a redis server running on the server machine. 
1. You can install redis by running the following commands on the terminal:
```
wget http://download.redis.io/redis-stable.tar.gz
tar xvzf redis-stable.tar.gz
cd redis-stable
make
```
2. To run redis, run the following command:
```
redis-server
```
> To know more about redis follow https://redis.io/

3. Next up, install required dependencies by going to the main directory of the repo and running the following command:

```npm install```

4. As for running the files,  run the ```database_client.js``` by running the following command on the root directory of the repo:
 ```node database_client.js```

5. Finally,run the server.js file from the same directory using:
 ```node server.js```

### Mobile Application
The final component of the system is the mobile application. The mobile application is built using the Cordova framework with Ionic1 to provide UI components. Cordova is a framework for JavaScript that uses AngularJS, therefore familiarity with JavaScript and AngularJS is essential to be able to contribute or edit the application.

1. Firstly, install Cordova and Ionic globally to your device by running the following commands:
```
npm i cordova -g
npm i ionic -g
```

2. Next, navigate within the repo to the frontend folder with the following command:
```
cd frontend
```
Add whichever platform you would like to run the application on.
#### Android
1. Download and install Java SDK and add JAVA to your device's $PATH 
2. Download and install Android Studio from https://developer.android.com/studio/ 
3. Add ANDROID_HOME to your $PATH. Instructions for adding to the $PATH depend on the operating system.
4. Download and install (from Android SDK Manager) 
- Android Platform SDK for your targeted version of Android
 - Android SDK build-tools version 19.1.0 or higher 
 - Android Support Repository (found under "Extras")

5. Next, add the platform with the command:
```
ionic cordova platform add android
```
6. Build the app:
```
ionic cordova build android
```
Alternatively, you could build it to the smart phone directly if it is connected and debugging is enabled on it using:
```
ionic cordova run android --device
```
You are good to go! 

We did not test the application with iOS and will not go into details regarding the method of building an iOS app. Users are free to test.
## Contributing

1. Fork it!
2. Create your feature branch: `git checkout -b my-new-feature`
3. Commit your changes: `git commit -am 'Add some feature'`
4. Push to the branch: `git push origin my-new-feature`
5. Submit a pull request :D