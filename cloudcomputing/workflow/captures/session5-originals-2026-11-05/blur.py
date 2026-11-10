# Blur sensitive IDs. Reads the untouched originals, writes shots/ and shots-hd/ (hd = 2x the same rects).
from PIL import Image, ImageFilter
ORIG='/home/nxtwave/Desktop/webslides/Web-Slides/Outputs/cloudcomputing/workflow/captures/session5-originals-2026-11-05'
OUT='/home/nxtwave/Desktop/webslides/Web-Slides/Outputs/cloudcomputing/cloud_networking_and_vpc/src/decks/figures/net'
R={
 'slide-25-1':[('banner vpc',250,22,454,45),('heading vpc',4,67,343,102),('VPC ID field',62,211,268,234),
               ('dopt',783,281,1007,305),('rtb',1159,281,1363,304),('acl',31,351,230,374),('Owner ID',1190,421,1320,443)],
 'slide-26-1':[('banner subnet',371,24,606,47),('filter chip subnet',115,166,350,186),('row subnet',450,260,686,283),('row vpc',950,260,1155,283)],
 'slide-26-2':[('banner subnet',378,92,616,115),('filter chip subnet',122,234,359,254),('row subnet',457,328,695,351),('row vpc',957,328,1162,351)],
 'slide-27-1':[('banner igw',193,18,401,40),('banner vpc',593,17,798,40),('heading igw',4,62,349,98),('igw ID field',62,198,271,222),
               ('VPC ID field',781,198,986,222),('Owner',1189,198,1319,220)],
 'slide-28-1':[('dropdown row 1 vpc',54,373,258,396),('dropdown row 2 vpc',54,411,260,435),('tooltip vpc',498,412,710,437)],
 'slide-28-2':[('dropdown row 1 vpc',26,280,231,303),('dropdown row 2 vpc',26,318,232,342),('tooltip vpc',458,311,670,335)],
}
for name,rects in R.items():
  for folder,k in (('shots',1),('shots-hd',2)):
    im=Image.open(f'{ORIG}/{folder}/{name}.png'); mode=im.mode; im=im.convert('RGBA')
    for _,x0,y0,x1,y1 in rects:
      box=(x0*k,y0*k,x1*k,y1*k)
      c=im.crop(box)
      for _ in range(3): c=c.filter(ImageFilter.GaussianBlur(max(6,0.35*(y1-y0))*k))
      im.paste(c,box)
    im.convert(mode).save(f'{OUT}/{folder}/{name}.png', optimize=True)
    print(folder,name,len(rects))
