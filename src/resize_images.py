# Resize all images in a certain folder with 50% and store the resulting image
# as new image.

from PIL import Image
from glob import glob
import os

input_path = './resources/img/avatar/elf/new/*.png'
save_file_prefix = 'small_'
recursive = True

dst_size = 0.60;

for filename in glob(input_path, recursive=recursive):
    print('[+] Processing: '+filename)
    with Image.open(os.path.join(filename)) as img:
        width, height = img.size
        new_size = (int(width*dst_size), int(height*dst_size))  # calculate new size by multiplying by 0.5
        resized_img = img.resize(new_size)
        base_folder   = os.path.dirname(filename)
        base_filename = os.path.basename(filename)

        resized_img.save(os.path.join(base_folder, save_file_prefix+base_filename))

        

