Steps used to set up a google cloud VM:

* Google Compute Engine resources:
```
n1-standard-2 (2 vCPUs, 7.5 GB memory) with CentOS 7 on a 70Gb boot disk 
standard (non-SSD) large disk (0.5 Tb)
```

* Format and mount the large disk  (based on: https://cloud.google.com/compute/docs/disks/add-persistent-disk)
```
sudo mkfs.ext4 -F -E lazy_itable_init=0,lazy_journal_init=0,discard /dev/disk/by-id/google-exac-gnomad-large-disk
sudo mkdir -p /mnt/disks/google-exac-gnomad-large-disk
sudo mount -o discard,defaults /dev/disk/by-id/google-exac-gnomad-large-disk /mnt/disks/google-exac-gnomad-large-disk
sudo chmod a+w /mnt/disks/google-exac-gnomad-large-disk/
echo UUID=`sudo blkid -s UUID -o value /dev/disk/by-id/google-exac-gnomad-large-disk` /mnt/disks/google-exac-gnomad-large-disk ext4 discard,defaults,nofail 0 2 | sudo tee -a /etc/fstab
sudo mkdir /local
sudo mount --bind /mnt/disks/google-exac-gnomad-large-disk /local  
```
Also, added /local/ as a 2nd mount point for the large disk: 

```
sudo emacs /etc/fstab   # add the line below
/mnt/disks/google-exac-gnomad-large-disk  /local                                   none bind
```

--------
Installing mongodb (based on: https://docs.mongodb.com/manual/tutorial/install-mongodb-on-red-hat)

```
sudo emacs /etc/yum.repos.d/mongodb-org-3.2.repo
and paste in:
  [mongodb-org-3.2]
  name=MongoDB Repository
  baseurl=https://repo.mongodb.org/yum/redhat/$releasever/mongodb-org/3.2/x86_64/
  gpgcheck=1
  enabled=1
  gpgkey=https://www.mongodb.org/static/pgp/server-3.2.asc

sudo yum install -y mongodb-org --nogpgcheck  # not sure why gpg check fails, but data isn't sensitive so ¯\_(ツ)_/¯

# edit mongod.conf: 
  sudo emacs /etc/mongod.conf  
       # modify 
       dbPath: /local/gnomad/database

# disable SELinux:
    # CentOS has SELinux security enabled by default, and it prevents mongod from starting using `sudo service mongod start`
    # official SELinux intro starts here: https://access.redhat.com/documentation/en-US/Red_Hat_Enterprise_Linux/6/html/Security-Enhanced_Linux/chap-Security-Enhanced_Linux-Introduction.html
    sudo emacs  /etc/selinux/config  
       # modify
       SELINUX=permissive

sudo chkconfig mongod on   # make sure mongod will start automatically when booting linux

# set ulimits as described in https://docs.mongodb.com/manual/reference/ulimit/
sudo emacs /etc/security/limits.d/99-mongodb-nproc.conf   
  
       # add these lines:
       mongod       hard    nproc     64000
       mongod       soft    nproc     64000
       
sudo emacs 


# disable hugepages by following the steps here: https://docs.mongodb.com/manual/tutorial/transparent-huge-pages/

sudo emacs /etc/init.d/disable-transparent-hugepages   # see webpage above for contents
sudo chmod 755 /etc/init.d/disable-transparent-hugepages
sudo chkconfig --add disable-transparent-hugepages

# reboot the VM 
sudo reboot
```

--------
Installing httpd+mod_wsgi

```
sudo yum install httpd
```



