# HYBrid

It's pretty fucking cool

## Installation

Clone repository to desired directory

To deploy/setup rooms,from terminal  go to directory and run the following

```
cd RPi/
npm install
```

Make changes to estimote.js as per your room configurations
Add map of the surrounding area as an image to ```/public/img```
Default map and room configurations are set up.

On the server side

Clone the repository to desired directory

Before running the server code, make sure there is a redis server running on the server machine. 

Go to project directory
Install required dependencies using the following command

```npm install```

Ensure that an instance of redis server is already running on the server machine. 
To know more about redis follow https://redis.io/

After initializing the redis server instance, first run the database_client.js file using ```node database_client.js```
After running the database client run the server.js file using ```node server.js```

## Contributing

1. Fork it!
2. Create your feature branch: `git checkout -b my-new-feature`
3. Commit your changes: `git commit -am 'Add some feature'`
4. Push to the branch: `git push origin my-new-feature`
5. Submit a pull request :D

