# A Blog Website Built with Remix

[Blog Website](https://laishere.vercel.app/)

For blog content, check [here](https://github.com/laishere/blog).

## Setup

1. Clone this repository

2. Update `app/lib/config.ts`

3. Copy `.env.template` to `.env` and change the content

4. Install dependencies
    
    ```sh
    npm run install
    ```

## Development

Run the dev server:

```sh
npm run dev
```

For generating the blog meta and view the blog posts locally. You need to setup the blog content locally and specify the path of the content in `.env` variable `VITE_LOCAL_CONTENT_DIR`. 

Please check the guide in [here](https://github.com/laishere/blog).

## Deploy to vercel

```sh
vercel
```
