require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./config/database');
const Prospect = require('./models/Prospect');

const playersToUpdate = [
    {
        name: "Kevin De Bruyne Jr",
        url: "https://b.fssta.com/uploads/application/soccer/headshots/2342.png"
    },
    {
        name: "Matheus Pereira",
        url: "https://thepfsa.co.uk/wp-content/uploads/2019/10/Matheus-Pereira.jpg"
    },
    {
        name: "Giovanni Rossi",
        url: "https://upload.wikimedia.org/wikipedia/commons/b/b7/Paolo_Rossi_at_the_1982_FIFA_World_Cup_%28cropped%29.jpg"
    },
    {
        name: "Harry Kane Clone",
        url: "https://img.fcbayern.com/image/upload/f_auto/q_auto/ar_1:1,c_fill,g_custom,w_768/v1691827799/cms/public/images/fcbayern-com/players/spielerportraits/ganzkoerper/harry-kane.png"
    },
    {
        name: "Samuel Eto'o Kid",
        url: "https://kids.kiddle.co/images/thumb/f/ff/Samuel_Eto%2527o_-_Inter_Mailand_%25281%2529.jpg/300px-Samuel_Eto%2527o_-_Inter_Mailand_%25281%2529.jpg"
    },
    {
        name: "Virgil Van Jr",
        url: "https://i2-prod.mirror.co.uk/article36741909.ece/ALTERNATES/s1200f/0_GettyImages-2261734317.jpg"
    },
    {
        name: "Leroy Sane II",
        url: "https://img.fcbayern.com/image/upload/f_auto/q_auto/t_cms-1x1-seo/v1656615390/cms/public/images/fcbayern-com/players/spielerportraits/ganzkoerper/leroy_sane.png"
    },
    {
        name: "N'Golo Kante Clone",
        url: "https://cdn.mos.cms.futurecdn.net/ajciuzTucwf9aiZMS6LN8f.jpg"
    },
    {
        name: "Alphonso Roadrunner",
        url: "https://pictures.trbna.com/image/c079f949-cc22-4e2a-a91f-5a2f655843c8?width=1920&quality=70"
    },
    {
        name: "Jan Oblak Jr",
        url: "https://media.gettyimages.com/id/2220080482/photo/los-angeles-california-jan-oblak-of-atletico-de-madrid-poses-for-a-portrait-during-the.jpg?s=612x612&w=gi&k=20&c=yKY1byZlX-U_nY_CamOgN5oW8yP-0o0SxBaexvVthho="
    }
];

const updateImages = async () => {
    try {
        await connectDB();
        
        for (const data of playersToUpdate) {
            const prospect = await Prospect.findOne({ name: { $regex: new RegExp(data.name, 'i') } });
            
            if (!prospect) {
                console.log(`Could not find prospect with name matching: ${data.name}`);
                continue;
            }

            prospect.avatarUrl = data.url;
            prospect.imageUrl = data.url;
            
            await prospect.save();
            console.log(`Successfully updated profile image for: ${prospect.name}`);
        }
        
        process.exit(0);
    } catch (error) {
        console.error('Error updating player images:', error);
        process.exit(1);
    }
};

updateImages();
