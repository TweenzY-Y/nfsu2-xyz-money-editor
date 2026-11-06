# nfsu2.xyz Money Editor

A small tool to change the money in your [nfsu2.xyz](https://nfsu2.xyz) save. nfsu2.xyz lets you play Need for Speed: Underground 2 in the browser. This tool opens the backup file you download from nfsu2.xyz, changes the money, and gives you a new backup to restore on nfsu2.xyz.

The tool is made only for nfsu2.xyz. It does not work with the original PC game or with console versions.

The tool runs in your browser. You do not need to install anything, and your file is not sent anywhere.

## How to use it

### 1. Save your game

Your backup only has what the game saved. In the game, press `Esc` (or `Start` on a controller) and go to **Garage > Save**.

### 2. Download a backup

On nfsu2.xyz, open the **Saves** tab. Under **Profiles**, click **Download backup**.

You get a file called something like `nfsu2-saves-2026-11-06_115219.zip`. Keep this file. It is your copy of the old save, so you can go back to it if something goes wrong.

You do not need to unzip it.

### 3. Open the tool

Download this project and open `index.html` in Chrome or Firefox. Double-click the file to open it.

### 4. Change the money

1. Click **Choose your nfsu2.xyz backup**, or drag the zip file onto the box.
2. The tool shows each profile in the backup and how much money it has now.
3. Type the new amount in **New money**. You can also click the buttons to add 100,000, 1,000,000 or 9,000,000.
4. Click **Download new backup**.

The browser saves a new file with `-money` at the end of the name, for example `nfsu2-saves-2026-11-06_115219-money.zip`.

### 5. Restore the new backup

Go back to nfsu2.xyz and open the **Saves** tab. Under **Profiles**, click **Restore** and choose the new `-money.zip` file.

nfsu2.xyz uses the new save the next time you press **Play**. Load your profile, and you should see the new money.

## If you use cloud saves

With cloud saves turned on, nfsu2.xyz syncs your saves between your devices. After you restore the new backup, click **Sync now** so the cloud gets the new money. If nfsu2.xyz asks which saves to keep, choose **Keep this browser's**. If you choose **Use the cloud's**, you get the old money back.

## Limits

You can set any whole number from 0 to 2,147,483,647.

The tool only works with backups from the **Saves** tab on nfsu2.xyz.

## If something goes wrong

If the game on nfsu2.xyz does not load your profile, open the **Saves** tab, click **Restore**, and choose your old backup from step 2.

## How it works

A backup from nfsu2.xyz is a zip file. Each profile is in it as `NFS Underground 2/<profile>/<profile>`. In that file, the money is a 4-byte number at offset `0xA16A`.

The tool finds every profile in the zip, changes those 4 bytes, and updates the zip checksum for that file. It does not change anything else, so the new zip is the same size as the old one.

## For developers

The backup logic is in `save.js`, and the page is `index.html`. There are no dependencies.

Run the tests with Node.js 20 or newer:

```
npm test
```
