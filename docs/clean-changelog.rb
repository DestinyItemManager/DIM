

ARGF.each_line do |line|
  if line =~ /^# v?([\d.]+)/
    version = $1
    date = `git show v#{version} --quiet --pretty="format:%ai"`.strip.split(/ /)[0]
    if $?.success?
      puts line.strip + " (#{date})"
    else
      puts line
    end
  else
    puts line
  end
end