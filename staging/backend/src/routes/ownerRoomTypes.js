const express = require("express");
const { z } = require("zod");
const prisma = require("../lib/prisma");
const authenticateToken = require("../middleware/auth");
const router = express.Router();

const roomTypeSchema = z.object({
  propertyId: z.string().uuid(),
  name: z.string().trim().min(2).max(120),
  description: z.string().trim().max(5000).optional().default(""),
  nightlyPrice: z.coerce.number().positive().finite().max(10000000),
  maxGuests: z.coerce.number().int().min(1).max(100).default(2),
  quantity: z.coerce.number().int().min(0).max(10000).default(1),
  bedConfiguration: z.array(z.object({type:z.string().trim().min(1).max(80),count:z.coerce.number().int().min(1).max(50)})).max(20).default([]),
  facilities: z.array(z.string().trim().min(1).max(120)).max(100).default([]),
  imageUrls: z.array(z.string().url().max(2048)).max(10).default([]),
  isActive: z.boolean().default(true),
  sortOrder: z.coerce.number().int().min(0).max(10000).default(0)
});
const updateSchema = roomTypeSchema.omit({propertyId:true}).partial();

async function authorizedOwner(ownerId) {
  const owner = await prisma.owner.findUnique({where:{id:ownerId},select:{role:true,canEditProperties:true}});
  if (!owner || owner.role !== "OWNER") return {error:{status:403,message:"Owner account required."}};
  if (!owner.canEditProperties) return {error:{status:403,message:"Room type editing is disabled by ROOMO administration."}};
  return {owner};
}
async function ownsProperty(ownerId, propertyId) {
  return prisma.property.findFirst({where:{id:propertyId,ownerId},select:{id:true}});
}
router.use(authenticateToken);
router.get("/properties", async(req,res,next)=>{
  try {
    const access=await authorizedOwner(req.owner.sub); if(access.error)return res.status(access.error.status).json({message:access.error.message});
    const properties=await prisma.property.findMany({where:{ownerId:req.owner.sub},orderBy:{title:"asc"},select:{id:true,title:true,city:true,state:true,status:true}});
    res.json({properties});
  } catch(e){next(e);}
});
router.get("/", async(req,res,next)=>{
  try {
    const access=await authorizedOwner(req.owner.sub); if(access.error)return res.status(access.error.status).json({message:access.error.message});
    const id=z.string().uuid().safeParse(req.query.propertyId);if(!id.success)return res.status(400).json({message:"Choose a property."});
    const property=await ownsProperty(req.owner.sub,id.data);if(!property)return res.status(404).json({message:"Property not found in your account."});
    const roomTypes=await prisma.roomType.findMany({where:{propertyId:id.data},orderBy:[{sortOrder:"asc"},{name:"asc"}]});
    res.json({roomTypes});
  }catch(e){next(e);}
});
router.post("/",async(req,res,next)=>{
  const parsed=roomTypeSchema.safeParse(req.body);if(!parsed.success)return res.status(400).json({message:"Please check the room type details."});
  try{
    const access=await authorizedOwner(req.owner.sub);if(access.error)return res.status(access.error.status).json({message:access.error.message});
    const property=await ownsProperty(req.owner.sub,parsed.data.propertyId);if(!property)return res.status(404).json({message:"Property not found in your account."});
    const roomType=await prisma.roomType.create({data:parsed.data});res.status(201).json({message:"Room type created.",roomType});
  }catch(e){if(e.code==="P2002")return res.status(409).json({message:"This property already has a room type with that name."});next(e);}
});
router.patch("/:id",async(req,res,next)=>{
  const id=z.string().uuid().safeParse(req.params.id),parsed=updateSchema.safeParse(req.body);
  if(!id.success||!parsed.success||!Object.keys(parsed.data||{}).length)return res.status(400).json({message:"Please provide valid room type details."});
  try{
    const access=await authorizedOwner(req.owner.sub);if(access.error)return res.status(access.error.status).json({message:access.error.message});
    const existing=await prisma.roomType.findFirst({where:{id:id.data,property:{ownerId:req.owner.sub}},select:{id:true}});
    if(!existing)return res.status(404).json({message:"Room type not found in your account."});
    const roomType=await prisma.roomType.update({where:{id:id.data},data:parsed.data});res.json({message:"Room type updated.",roomType});
  }catch(e){if(e.code==="P2002")return res.status(409).json({message:"This property already has a room type with that name."});next(e);}
});
router.delete("/:id",async(req,res,next)=>{
  const id=z.string().uuid().safeParse(req.params.id);if(!id.success)return res.status(400).json({message:"Invalid room type ID."});
  try{
    const access=await authorizedOwner(req.owner.sub);if(access.error)return res.status(access.error.status).json({message:access.error.message});
    const existing=await prisma.roomType.findFirst({where:{id:id.data,property:{ownerId:req.owner.sub}},select:{id:true}});
    if(!existing)return res.status(404).json({message:"Room type not found in your account."});
    await prisma.roomType.delete({where:{id:id.data}});res.json({message:"Room type deleted."});
  }catch(e){next(e);}
});
module.exports=router;
