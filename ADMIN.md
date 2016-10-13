Steps used to set up a google cloud VM:

* Google Compute Engine resources:
```
n1-standard-2 (2 vCPUs, 7.5 GB memory) with CentOS 7 on a 70Gb boot disk 
standard (non-SSD) large disk (0.5 Tb)
```

* Format and mount the large disk:
```
sudo mkfs.ext4 -F -E lazy_itable_init=0,lazy_journal_init=0,discard /dev/disk/by-id/google-exac-gnomad-large-disk
sudo mkdir -p /mnt/disks/google-exac-gnomad-large-disk
sudo mount -o discard,defaults /dev/disk/by-id/google-exac-gnomad-large-disk /mnt/disks/google-exac-gnomad-large-disk
sudo chmod a+w /mnt/disks/google-exac-gnomad-large-disk/
echo UUID=`sudo blkid -s UUID -o value /dev/disk/by-id/google-exac-gnomad-large-disk` /mnt/disks/google-exac-gnomad-large-disk ext4 discard,defaults 1 1 | sudo tee -a /etc/fstab
sudo mkdir /local
sudo mount --bind /mnt/disks/google-exac-gnomad-large-disk /local  
```

--------
Installing mongodb:

Based on: https://docs.mongodb.com/manual/tutorial/install-mongodb-on-red-hat/

```
sudo emacs /etc/yum.repos.d/mongodb-org-3.2.repo
and paste in:
  [mongodb-org-3.2]
  name=MongoDB Repository
  baseurl=https://repo.mongodb.org/yum/redhat/$releasever/mongodb-org/3.2/x86_64/
  gpgcheck=1
  enabled=1
  gpgkey=https://www.mongodb.org/static/pgp/server-3.2.asc

sudo service mongod start
```

