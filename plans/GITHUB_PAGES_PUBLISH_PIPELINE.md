# problem

i want to set this project up to be a github pages static site.

it is already nearly there, HOWEVER, it requires the game data files for .ktx2 textures, .glb models and .xml data files.

I DO NOT want to check these into this project, as they are proprietary and large in size.

i have a license granted to me to use them, but, i want to have them checked into a PRIVATE GitHub companion git repo that the build pipeline will need to checkout before doing the vite SPA build.

setup a github pages pipeline for this with the following assumptions:

