file=$1
md5=$(date -d \@$((0x$(md5sum $file | cut -b 1-7))))
touch $file -d $md5 -c