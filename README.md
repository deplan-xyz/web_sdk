# `deplan-client`

This package allows you to seamlessly integrate your web application with DePlan wallet.

## Installing

```sh
# npm
npm install deplan-client

# yarn
yarn add deplan-client
```

## Usage

```ts
import { DePlanClient } from "deplan-client";

const deplanClient = new DePlanClient();

// Connect
const { address } = await deplanClient.connect();

// Sign In
const { address, signature, message } = await deplanClient.signIn();
